-- 명부 직분(member.duty) 옵션을 DB로 관리한다.
-- UI는 항상 고정 의사옵션 `없음`(members.duty = null)을 맨 앞에 덧붙이므로
-- `없음`은 이 테이블에 넣지 않는다(삭제 대상이 아님).
-- 열람은 승인된 청년(member+) 전체, 추가/수정/삭제는 임원(officer+)만 가능.

create table public.member_duties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_duties_name_not_blank check (length(btrim(name)) between 1 and 30),
  constraint member_duties_name_trimmed check (name = btrim(name))
);

create index member_duties_order_idx on public.member_duties (sort_order, name);

alter table public.member_duties enable row level security;

create policy member_duties_select on public.member_duties
  for select using (role_at_least('member'));

create policy member_duties_write_insert on public.member_duties
  for insert
  with check (role_at_least('officer'));

create policy member_duties_write_update on public.member_duties
  for update
  using (role_at_least('officer'))
  with check (role_at_least('officer'));

create policy member_duties_write_delete on public.member_duties
  for delete
  using (role_at_least('officer'));

-- 실제 직분 옵션 시드 (의사옵션 `없음` 제외)
insert into public.member_duties (name, sort_order) values
  ('셀리더', 1),
  ('회장', 2),
  ('부회장', 3),
  ('총무', 4),
  ('부총무', 5),
  ('서기', 6),
  ('회계', 7),
  ('팀장', 8)
on conflict (name) do nothing;
