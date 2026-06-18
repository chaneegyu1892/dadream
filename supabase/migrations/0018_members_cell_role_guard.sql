-- members.cell_role / members.officer_position 변경 가드 트리거.
-- RLS의 members_write는 role_at_least('officer')만 요구하므로,
-- officer가 임의로 다른 사람을 '셀리더'로 박거나 직책을 부여하는 구멍이 있다.
-- 0016의 profiles 가드와 같은 패턴: 동적 검사(OLD vs NEW)를 트리거로 표현.
--
-- 규칙:
--   1) cell_role이 실제로 바뀔 때만 검사 (다른 컬럼 update는 자유)
--   2) actor가 officer+이고 본인의 member row가 아닐 때만 허용
--      (본인 row는 staff+가 직접 관리 — RLS profiles_admin_update와 유사한 self-권한 분리)
--   3) officer_position이 실제로 바뀔 때만 검사
--   4) officer_position은 더 민감 → staff+만 부여 가능 (회장/부회장은 staff+ 결정 영역)
--   5) 둘 다 NULL로 가는 해제는 officer+도 가능 (임명 해제는 덜 민감)
--   6) 인증되지 않은 호출자(auth.uid()=null)는 백엔드 경로만 허용
--
-- 주의:
--   - SECURITY DEFINER. 트리거 내부에서 auth.uid() 비교 + profiles 조회.
--   - 자기 자신의 member row 검사 시: actor의 user_id → profiles.member_id로
--     자기 member id를 얻어 old.id와 비교. member_id가 NULL인 user(미승인)는
--     자기 row가 없으므로 rule 2가 자연스럽게 통과.

create or replace function public.guard_member_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role user_role;
  v_actor_rank int;
  v_actor_member_id uuid;
  v_self_row boolean := false;
  v_cell_role_changed boolean := old.cell_role is distinct from new.cell_role;
  v_officer_pos_changed boolean := old.officer_position is distinct from new.officer_position;
begin
  -- 둘 다 안 바뀌면 통과
  if not (v_cell_role_changed or v_officer_pos_changed) then
    return new;
  end if;

  -- 6) 인증되지 않은 호출자: 백엔드 경로만 허용
  if v_actor is null then
    if current_user in ('service_role', 'postgres', 'supabase_admin') then
      return new;
    end if;
    raise exception '권한 변경은 인증된 사용자만 가능합니다.'
      using errcode = '42501';
  end if;

  -- actor 권한 조회 (0002의 current_app_role 헬퍼 재사용)
  v_actor_role := public.current_app_role();
  if v_actor_role is null then
    raise exception '승인된 사용자만 권한을 변경할 수 있어요.'
      using errcode = '42501';
  end if;
  v_actor_rank := public.role_rank(v_actor_role);

  -- actor의 member_id 조회 (자기 member row 여부 판정)
  select member_id into v_actor_member_id
    from public.profiles
   where id = v_actor;
  v_self_row := v_actor_member_id is not null and v_actor_member_id = old.id;

  -- 2) cell_role 변경 가드
  if v_cell_role_changed then
    -- 본인 row 변경은 staff+만 허용
    if v_self_row then
      if v_actor_rank < role_rank('staff') then
        raise exception '본인의 셀 역할은 staff+에게 요청해주세요.'
          using errcode = '42501';
      end if;
    else
      -- 타인 row: officer+ 가능. 단 NULL로의 해제는 officer+도 가능.
      if v_actor_rank < role_rank('officer') then
        raise exception '셀 역할 변경은 임원 이상만 가능합니다.'
          using errcode = '42501';
      end if;
    end if;
  end if;

  -- 3·4) officer_position 변경 가드 (더 엄격)
  if v_officer_pos_changed then
    -- NULL로의 해제(임명 해제)는 officer+도 가능
    if new.officer_position is null then
      if v_actor_rank < role_rank('officer') then
        raise exception '직책 해제는 임원 이상만 가능합니다.'
          using errcode = '42501';
      end if;
    else
      -- 부여는 staff+만 가능
      if v_actor_rank < role_rank('staff') then
        raise exception '직책 부여는 staff+만 가능합니다.'
          using errcode = '42501';
      end if;
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_guard_member_role_change on public.members;
create trigger trg_guard_member_role_change
  before update of cell_role, officer_position on public.members
  for each row execute function public.guard_member_role_change();

revoke execute on function public.guard_member_role_change() from anon, public;
