-- profiles.role / profiles.approval 변경에 대한 권한 상승/강등 가드.
-- RLS의 profiles_admin_update는 role_at_least('officer')만 요구하므로,
-- officer가 다른 officer를 강등하거나 staff/pastor를 임의 변경할 수 있는 구멍이 있다.
-- 이 트리거는 RLS로 표현할 수 없는 "동적 가드" (OLD vs NEW 비교)를 담당한다.
--
-- 규칙:
--   1) 자기 자신의 role/approval 변경은 항상 차단 (자신의 권한을 스스로 올릴 수 없게)
--   2) role/approval이 실제로 바뀔 때만 검사 (다른 컬럼 update는 자유)
--   3) staff 이상만 role/approval 변경 가능
--   4) officer는 officer 이하(member/officer)만 변경 가능
--   5) 변경되는 new role은 actor의 role 이하여야 한다 (actor가 staff면 staff까지만 부여 가능)
--   6) 인증되지 않은 호출자(auth.uid()=null)는 백엔드 경로(service_role/postgres/supabase_admin)만 허용
--
-- 주의:
--   - 이 함수는 SECURITY DEFINER로 작성되어 트리거 내부에서 auth.uid() 비교에 사용된다.
--   - 단, 권한 위임 표면(API surface)으로 노출하지 않으므로 EXECUTE는 revoke 한다.
--   - search_path를 명시하여 search_path injection을 차단한다.

create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role user_role;
  v_actor_rank int;
  v_old_rank int := role_rank(old.role);
  v_new_rank int := role_rank(new.role);
  v_role_changed boolean := old.role is distinct from new.role;
  v_approval_changed boolean := old.approval is distinct from new.approval;
begin
  -- role/approval이 실제로 바뀌지 않으면 통과 (다른 컬럼 업데이트는 허용)
  -- 참고: 트리거가 BEFORE UPDATE OF (role, approval) 이므로 PG가 이 경우를 걸러주지만,
  -- 향후 OF 절을 제거할 경우를 대비해 명시적으로 다시 확인한다.
  if not (v_role_changed or v_approval_changed) then
    return new;
  end if;

  -- 6) 인증되지 않은 호출자: 백엔드 경로(service_role/postgres/supabase_admin)만 허용
  -- anon/authenticated가 RLS를 우회하여 도달한 경우를 명시적으로 차단한다.
  if v_actor is null then
    if current_user in ('service_role', 'postgres', 'supabase_admin') then
      return new;
    end if;
    raise exception '권한 변경은 인증된 사용자만 가능합니다.'
      using errcode = '42501';
  end if;

  -- 1) 자기 자신 변경은 항상 차단 (모든 역할)
  if v_actor = old.id then
    raise exception '본인의 권한은 변경할 수 없어요. (staff 이상에게 요청해주세요)'
      using errcode = '42501';
  end if;

  -- 3) actor 권한 조회 (0002의 current_app_role 헬퍼 재사용)
  v_actor_role := public.current_app_role();
  if v_actor_role is null then
    raise exception '승인된 사용자만 권한을 변경할 수 있어요.'
      using errcode = '42501';
  end if;
  v_actor_rank := public.role_rank(v_actor_role);

  -- 3) staff 이상만 role/approval 변경 가능 (officer는 자신과 동급 이하만)
  if v_actor_rank < role_rank('officer') then
    raise exception '임원 이상만 권한을 변경할 수 있어요.'
      using errcode = '42501';
  end if;

  -- 4) officer는 officer 이상 역할의 사용자는 변경 불가
  if v_actor_rank = role_rank('officer') and v_old_rank > v_actor_rank then
    raise exception '본인보다 높은 권한의 사용자를 변경할 수 없어요.'
      using errcode = '42501';
  end if;

  -- 5) 부여하려는 새 role이 actor의 role 이하여야 한다
  if v_role_changed and v_new_rank > v_actor_rank then
    raise exception '본인보다 높은 권한을 부여할 수 없어요.'
      using errcode = '42501';
  end if;

  return new;
end $$;

-- 트리거는 profiles의 BEFORE UPDATE에 부착한다.
-- auth.users 레코드는 on delete cascade로 지워지므로 profiles 자체 삭제는 여기서 다루지 않는다.
drop trigger if exists trg_guard_profile_role_change on public.profiles;
create trigger trg_guard_profile_role_change
  before update of role, approval on public.profiles
  for each row execute function public.guard_profile_role_change();

-- 함수를 일반 클라이언트가 직접 호출하지 못하게 권한을 박탈한다.
-- 트리거 내부에서만 동작하도록.
revoke execute on function public.guard_profile_role_change() from anon, public;
