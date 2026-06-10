-- 보안 어드바이저 경고 해소
alter function public.role_rank(user_role) set search_path = public;

-- RLS 정책 평가에는 authenticated의 EXECUTE가 필요하므로 anon/public만 차단
revoke execute on function public.current_app_role() from anon, public;
revoke execute on function public.my_member_id() from anon, public;
revoke execute on function public.role_at_least(user_role) from anon, public;

-- 트리거 전용 함수는 API로 호출할 일이 없으므로 전부 차단
revoke execute on function public.handle_new_user() from anon, authenticated, public;
