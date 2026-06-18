-- approve_profile_tx 보강: 자기 자신 승인 차단 + 트랜잭션 일관성.
-- 0016의 BEFORE UPDATE 트리거가 auth.uid()=old.id 가드를 제공하지만,
-- RPC 본체에서 한 번 더 검사하면 RLS/트리거 우회 경로(seed/admin)에서도 안전하다.
-- 또한 부여 role이 actor의 role 이하여야 한다는 불변식을 RPC 차원에서 명시한다.

create or replace function public.approve_profile_tx(
  p_profile_id uuid,
  p_role user_role,
  p_member_id uuid default null,
  p_new_member_name text default null,
  p_new_member_cell_id uuid default null
) returns void language plpgsql security invoker set search_path = public as $$
declare
  v_member_id uuid := p_member_id;
  v_actor_role user_role := public.current_app_role();
begin
  if v_actor_role is null or not role_at_least('officer') then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  -- 자기 자신 승인은 차단 (트리거 0016이 가드하지만 RPC 차원에서도 한 번 더)
  if p_profile_id = auth.uid() then
    raise exception '본인 가입은 staff+에게 요청해주세요.'
      using errcode = '42501';
  end if;

  -- 부여 role이 actor의 role 이하여야 함
  if role_rank(p_role) > role_rank(v_actor_role) then
    raise exception '본인보다 높은 권한을 부여할 수 없어요.'
      using errcode = '42501';
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
