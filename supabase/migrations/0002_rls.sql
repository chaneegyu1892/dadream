-- RLS 헬퍼 및 정책: 권한은 DB 차원에서 강제한다
create or replace function public.current_app_role()
returns user_role language sql security definer stable set search_path = public as $$
  select role from profiles where id = auth.uid() and approval = 'approved'
$$;

create or replace function public.role_rank(r user_role)
returns int language sql immutable as $$
  select case r when 'member' then 0 when 'officer' then 1 when 'staff' then 2 when 'pastor' then 3 end
$$;

create or replace function public.role_at_least(min_role user_role)
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce(role_rank(current_app_role()) >= role_rank(min_role), false)
$$;

create or replace function public.my_member_id()
returns uuid language sql security definer stable set search_path = public as $$
  select member_id from profiles where id = auth.uid() and approval = 'approved'
$$;

alter table cells enable row level security;
alter table members enable row level security;
alter table member_private enable row level security;
alter table profiles enable row level security;
alter table events enable row level security;
alter table visit_requests enable row level security;
alter table visit_notes enable row level security;
alter table notifications enable row level security;

-- cells / members / events: 승인된 사용자 전체 열람, officer+ 편집
create policy cells_select on cells for select using (role_at_least('member'));
create policy cells_write on cells for all using (role_at_least('officer'));
create policy members_select on members for select using (role_at_least('member'));
create policy members_write on members for all using (role_at_least('officer'));
create policy events_select on events for select using (role_at_least('member'));
create policy events_write on events for all using (role_at_least('officer'));

-- member_private: staff+ 또는 본인만
create policy private_select on member_private for select
  using (role_at_least('staff') or member_id = my_member_id());
create policy private_write on member_private for all using (role_at_least('staff'));

-- profiles: 본인 열람 + officer+ 승인 처리
create policy profiles_self on profiles for select using (id = auth.uid());
create policy profiles_admin_select on profiles for select using (role_at_least('officer'));
create policy profiles_admin_update on profiles for update using (role_at_least('officer'));

-- visit_requests: 본인 것 + staff/pastor 전체
create policy visits_select on visit_requests for select
  using (role_at_least('staff') or member_id = my_member_id() or requested_by = auth.uid());
create policy visits_insert on visit_requests for insert
  with check (role_at_least('member'));
create policy visits_update_own on visit_requests for update
  using (member_id = my_member_id() or requested_by = auth.uid());
create policy visits_update_admin on visit_requests for update using (role_at_least('staff'));

-- visit_notes: 목사님 전용 (목양 메모)
create policy notes_all on visit_notes for all using (role_at_least('pastor'));

-- notifications: 본인 것만 열람·읽음 처리
create policy notif_select on notifications for select using (profile_id = auth.uid());
create policy notif_update on notifications for update using (profile_id = auth.uid());
