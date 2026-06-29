-- 성능 advisor 정리: (1) 미인덱싱 외래키에 인덱스 추가, (2) RLS initplan 최적화.
--
-- 동작(권한 의미)은 그대로 두고 평가 비용만 낮춘다.
--   - FK 인덱스: 부모 행 삭제/조인 시 풀스캔을 막는다.
--   - RLS initplan: auth.uid()/헬퍼 함수를 (select ...)로 감싸 행마다 재평가하지 않고
--     쿼리당 한 번만 평가하도록 한다(Supabase RLS 성능 가이드). 결과값은 동일하다.

-- ────────────────────────────────────────────────────────────────────────────
-- 1) 미인덱싱 외래키 인덱스
-- ────────────────────────────────────────────────────────────────────────────
create index if not exists events_created_by_idx
  on public.events (created_by);
create index if not exists meeting_items_assignee_idx
  on public.meeting_items (assignee_member_id);
create index if not exists meeting_items_carried_from_idx
  on public.meeting_items (carried_from);
create index if not exists service_assignments_member_idx
  on public.service_assignments (member_id);
create index if not exists service_assignments_role_idx
  on public.service_assignments (role_id);
create index if not exists visit_notes_visit_idx
  on public.visit_notes (visit_id);
create index if not exists visit_requests_requested_by_idx
  on public.visit_requests (requested_by);
create index if not exists wedding_plans_member_idx
  on public.wedding_plans (member_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 2) RLS initplan 최적화 (의미 동일, (select ...)로 행 단위 재평가 제거)
--    0002의 정책 정의를 그대로 옮기되 함수 호출만 (select ...)로 감싼다.
--    UPDATE 정책에 WITH CHECK를 따로 두지 않으면 USING이 체크에도 쓰이는
--    Postgres 기본 동작을 유지한다.
-- ────────────────────────────────────────────────────────────────────────────

-- profiles: 본인 행 열람
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for select using (id = (select auth.uid()));

-- visit_requests: 본인 것 + staff/pastor 전체 열람
drop policy if exists visits_select on public.visit_requests;
create policy visits_select on public.visit_requests
  for select using (
    (select role_at_least('staff'))
    or member_id = (select my_member_id())
    or requested_by = (select auth.uid())
  );

-- visit_requests: 신청 당사자 본인 수정
drop policy if exists visits_update_own on public.visit_requests;
create policy visits_update_own on public.visit_requests
  for update using (
    member_id = (select my_member_id())
    or requested_by = (select auth.uid())
  );

-- notifications: 본인 것만 열람
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications
  for select using (profile_id = (select auth.uid()));

-- notifications: 본인 것만 읽음 처리
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications
  for update using (profile_id = (select auth.uid()));
