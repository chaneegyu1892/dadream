-- 성능 개선: 실제 화면 쿼리의 filter/order 패턴에 맞춘 인덱스
-- 150~300명 규모에서도 로그인 후 SSR 왕복 시간을 줄이기 위한 보강이다.

-- layout 알림: profile_id로 제한하고 최신순 15개를 읽는다.
create index if not exists notifications_profile_created_idx
  on notifications (profile_id, created_at desc);

-- 명부/승인/심방 신청/예배위원/결혼 관리에서 active + name 정렬을 반복한다.
create index if not exists members_active_name_idx
  on members (active, name);

-- 임원회의 담당자 선택 등 active + is_officer + name 패턴을 보강한다.
create index if not exists members_active_officer_name_idx
  on members (active, is_officer, name);

-- 홈/캘린더 일정 범위 조회와 시작일 정렬을 보강한다.
create index if not exists events_starts_at_idx
  on events (starts_at);

-- 홈/심방 목록의 최신순 조회와 상태 필터를 보강한다.
create index if not exists visit_requests_created_idx
  on visit_requests (created_at desc);

create index if not exists visit_requests_status_created_idx
  on visit_requests (status, created_at desc);

-- 멤버 상세의 개인별 심방 이력 최신순 조회를 보강한다.
create index if not exists visit_requests_member_created_idx
  on visit_requests (member_id, created_at desc);

-- 관리자 승인 대기 목록과 관리 허브 카운트 패턴을 보강한다.
create index if not exists profiles_approval_created_idx
  on profiles (approval, created_at);

-- 임원회의 목록 최신순 조회를 보강한다.
create index if not exists meetings_meeting_date_idx
  on meetings (meeting_date desc);

-- 결혼 예정 리스트 날짜순 조회를 보강한다.
create index if not exists wedding_plans_wedding_date_idx
  on wedding_plans (wedding_date);
