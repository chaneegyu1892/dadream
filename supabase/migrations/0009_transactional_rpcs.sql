-- 다단계 쓰기 작업을 단일 트랜잭션으로 묶는 RPC 함수들.
-- security invoker라 테이블 RLS가 그대로 적용되고, 명시적 role 체크를 한 번 더 둔다.

-- 가입 승인: 명부 INSERT(신규인 경우) + 프로필 승인 UPDATE를 원자적으로 처리.
-- 기존에는 두 쿼리 사이 실패 시 고아 member 행이 남을 수 있었다.
create or replace function public.approve_profile_tx(
  p_profile_id uuid,
  p_role user_role,
  p_member_id uuid default null,
  p_new_member_name text default null,
  p_new_member_cell_id uuid default null
) returns void language plpgsql security invoker set search_path = public as $$
declare
  v_member_id uuid := p_member_id;
begin
  if not role_at_least('officer') then
    raise exception 'not authorized';
  end if;

  if v_member_id is null then
    if p_new_member_name is null or length(trim(p_new_member_name)) = 0 then
      raise exception 'member id or new member name required';
    end if;
    insert into members (name, cell_id, is_officer)
    values (trim(p_new_member_name), p_new_member_cell_id, p_role in ('officer', 'staff', 'pastor'))
    returning id into v_member_id;
  end if;

  update profiles
     set approval = 'approved', role = p_role, member_id = v_member_id
   where id = p_profile_id;

  if not found then
    raise exception 'profile not found';
  end if;
end $$;

revoke execute on function public.approve_profile_tx(uuid, user_role, uuid, text, uuid) from anon, public;

-- 회의 항목 추가: sort_order를 단일 문장에서 계산해 COUNT→INSERT 경쟁 조건 제거
create or replace function public.add_meeting_item_tx(
  p_meeting_id uuid,
  p_content text,
  p_assignee_member_id uuid default null
) returns void language plpgsql security invoker set search_path = public as $$
begin
  if not role_at_least('officer') then
    raise exception 'not authorized';
  end if;
  insert into meeting_items (meeting_id, content, assignee_member_id, sort_order)
  values (
    p_meeting_id,
    p_content,
    p_assignee_member_id,
    coalesce((select max(sort_order) from meeting_items where meeting_id = p_meeting_id), 0) + 1
  );
end $$;

revoke execute on function public.add_meeting_item_tx(uuid, text, uuid) from anon, public;

-- 예배 직책 추가: sort_order 동일 패턴
create or replace function public.add_service_role_tx(p_name text)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not role_at_least('officer') then
    raise exception 'not authorized';
  end if;
  insert into service_roles (name, sort_order)
  values (p_name, coalesce((select max(sort_order) from service_roles), 0) + 1);
end $$;

revoke execute on function public.add_service_role_tx(text) from anon, public;
