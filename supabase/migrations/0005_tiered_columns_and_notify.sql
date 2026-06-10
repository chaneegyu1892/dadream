-- 연락처·생일을 별도 테이블로 분리해 컬럼 수준 접근 제어를 RLS로 강제
create table member_contact (
  member_id uuid primary key references members(id) on delete cascade,
  phone text,
  birth_date date,
  baptized boolean,
  updated_at timestamptz not null default now()
);

-- 기존 members 컬럼 제거 (아직 데이터 없음)
alter table members drop column phone;
alter table members drop column birth_date;
alter table members drop column baptized;

alter table member_contact enable row level security;

-- officer+ 또는 본인만 열람, officer+만 수정
create policy contact_select on member_contact for select
  using (role_at_least('officer') or member_id = my_member_id());
create policy contact_write on member_contact for all using (role_at_least('officer'));

-- 알림 발송: RLS상 타인 행 insert가 불가하므로 SECURITY DEFINER 함수로 처리
create or replace function public.push_notification(
  target uuid, n_type text, n_title text, n_body text, n_link text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not role_at_least('member') then
    raise exception 'not authorized';
  end if;
  insert into notifications (profile_id, type, title, body, link)
  values (target, n_type, n_title, n_body, n_link);
end $$;

-- 목사님 전체에게 알림 (심방 신청 시)
create or replace function public.notify_pastors(
  n_type text, n_title text, n_body text, n_link text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not role_at_least('member') then
    raise exception 'not authorized';
  end if;
  insert into notifications (profile_id, type, title, body, link)
  select id, n_type, n_title, n_body, n_link
  from profiles where role = 'pastor' and approval = 'approved';
end $$;

revoke execute on function public.push_notification(uuid,text,text,text,text) from anon, public;
revoke execute on function public.notify_pastors(text,text,text,text) from anon, public;
