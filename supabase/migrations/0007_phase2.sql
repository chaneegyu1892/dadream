-- 2차: 결혼 예정, 임원회의 체크리스트, 예배위원 배정
create table wedding_plans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  partner_name text,
  wedding_date date,
  venue text,
  note text,
  created_at timestamptz not null default now()
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date not null,
  created_at timestamptz not null default now()
);

create table meeting_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  content text not null,
  assignee_member_id uuid references members(id) on delete set null,
  done boolean not null default false,
  carried_from uuid references meeting_items(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table service_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table service_assignments (
  id uuid primary key default gen_random_uuid(),
  service_date date not null,
  role_id uuid not null references service_roles(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (service_date, role_id, member_id)
);

create index meeting_items_meeting_idx on meeting_items (meeting_id);
create index service_assignments_date_idx on service_assignments (service_date);

alter table wedding_plans enable row level security;
alter table meetings enable row level security;
alter table meeting_items enable row level security;
alter table service_roles enable row level security;
alter table service_assignments enable row level security;

-- 결혼·임원회의: officer+ 전용
create policy weddings_all on wedding_plans for all using (role_at_least('officer'));
create policy meetings_all on meetings for all using (role_at_least('officer'));
create policy meeting_items_all on meeting_items for all using (role_at_least('officer'));

-- 예배위원: 전체 열람, officer+ 편집
create policy service_roles_select on service_roles for select using (role_at_least('member'));
create policy service_roles_write on service_roles for all using (role_at_least('officer'));
create policy service_assign_select on service_assignments for select using (role_at_least('member'));
create policy service_assign_write on service_assignments for all using (role_at_least('officer'));

-- 기본 직책 시드 (관리 화면에서 수정 가능)
insert into service_roles (name, sort_order) values
  ('사회', 1), ('대표기도', 2), ('찬양인도', 3), ('헌금위원', 4), ('안내', 5), ('미디어', 6);
