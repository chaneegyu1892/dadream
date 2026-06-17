-- 권한 상승·상태 위조 차단 가드 (BEFORE UPDATE 트리거)
--
-- 배경: 기존 RLS 정책(profiles_admin_update, visits_update_own)에는 WITH CHECK가
-- 없어, 인증된 사용자가 PostgREST로 테이블을 직접 PATCH하면 서버 액션의 검증을
-- 우회할 수 있었다. 트리거는 직접 UPDATE와 RPC(security invoker) 모두에 적용되므로
-- 마지막 방어선으로 가장 견고하다.
--
-- 두 트리거 모두 auth.uid()가 없는 컨텍스트(서비스 롤·마이그레이션·시드)는 신뢰하고
-- 통과시킨다. 초기 목사/부장 계정 셋업은 SQL 에디터(서비스 롤)에서 그대로 가능하다.

-- ────────────────────────────────────────────────────────────────────────────
-- 1) profiles: 권한 상승 차단
--    - 본인의 role/approval은 스스로 바꿀 수 없다(자가 승격·자가 승인 차단).
--    - 자기 역할보다 높은 역할은 부여할 수 없다(officer가 staff/pastor를 임의 생성 차단).
--      → pastor만 pastor를 부여할 수 있고, staff는 staff까지, officer는 officer까지.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.guard_profile_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor_role user_role;
begin
  -- 서버(서비스 롤)·마이그레이션 등 JWT 없는 신뢰 컨텍스트는 통과
  if auth.uid() is null then
    return new;
  end if;

  -- role/approval이 그대로면 검사할 게 없다
  if new.role = old.role and new.approval = old.approval then
    return new;
  end if;

  actor_role := current_app_role();

  -- 본인 프로필의 role/approval은 스스로 변경 불가
  if new.id = auth.uid() then
    raise exception '본인의 역할·승인 상태는 변경할 수 없습니다';
  end if;

  -- 자기보다 높은 역할은 부여 불가 (대상 행의 기존 역할이 더 높은 경우도 차단)
  if role_rank(new.role) > coalesce(role_rank(actor_role), -1)
     or role_rank(old.role) > coalesce(role_rank(actor_role), -1) then
    raise exception '자신보다 높은 역할은 부여하거나 수정할 수 없습니다';
  end if;

  return new;
end $$;

drop trigger if exists guard_profile_role_change on profiles;
create trigger guard_profile_role_change
  before update on profiles
  for each row execute function public.guard_profile_role_change();

-- ────────────────────────────────────────────────────────────────────────────
-- 2) visit_requests: 상태머신 우회 차단
--    staff+ 는 전체 전이 허용(서버 액션의 canTransition·낙관적 잠금이 관할).
--    일반 사용자(본인 신청 회원/임원)는 다음 두 전이만 허용:
--      - 취소: → cancelled
--      - 제안 수락: proposed → confirmed
--    그 외(requested→confirmed 자가 확정 등)는 차단.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.guard_visit_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  -- 상태가 그대로면 통과(희망 시간·메모 수정 등)
  if new.status = old.status then
    return new;
  end if;

  -- staff(부장/부감)·pastor는 전체 전이 허용
  if role_at_least('staff') then
    return new;
  end if;

  -- 일반 사용자 허용 전이: 취소, 또는 제안된 일정 수락
  if new.status = 'cancelled' then
    return new;
  end if;
  if old.status = 'proposed' and new.status = 'confirmed' then
    return new;
  end if;

  raise exception '허용되지 않은 심방 상태 전이입니다';
end $$;

drop trigger if exists guard_visit_status_change on visit_requests;
create trigger guard_visit_status_change
  before update on visit_requests
  for each row execute function public.guard_visit_status_change();

-- 트리거 전용 함수는 API로 직접 호출할 일이 없으므로 EXECUTE를 회수한다(0003 관례).
revoke execute on function public.guard_profile_role_change() from anon, authenticated, public;
revoke execute on function public.guard_visit_status_change() from anon, authenticated, public;
