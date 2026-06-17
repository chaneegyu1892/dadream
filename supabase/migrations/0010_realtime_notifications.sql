-- 알림 실시간 구독: notifications 테이블을 supabase_realtime 퍼블리케이션에 추가한다.
-- RLS(notif_select: profile_id = auth.uid())가 realtime에도 그대로 적용되므로
-- 사용자는 자기 알림의 INSERT 이벤트만 수신한다.
--
-- ALTER PUBLICATION ... ADD TABLE 은 이미 등록된 경우 에러가 나므로
-- 멱등하게 처리한다(재실행·기본 등록 환경 모두 안전).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;
