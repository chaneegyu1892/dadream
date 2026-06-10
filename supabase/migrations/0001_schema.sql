-- 다드림 대시보드 기본 스키마
create type user_role as enum ('member','officer','staff','pastor');
create type approval_status as enum ('pending','approved','rejected');
create type visit_status as enum ('requested','proposed','confirmed','completed','declined','cancelled');

create table cells (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_path text,
  birth_date date,
  phone text,
  cell_id uuid references cells(id) on delete set null,
  duty text,
  baptized boolean,
  is_officer boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table member_private (
  member_id uuid primary key references members(id) on delete cascade,
  address text,
  workplace text,
  family_info text,
  updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  member_id uuid unique references members(id) on delete set null,
  role user_role not null default 'member',
  approval approval_status not null default 'pending',
  kakao_nickname text,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  description text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table visit_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  requested_by uuid references profiles(id) on delete set null,
  preferred_slots jsonb not null default '[]',
  message text,
  status visit_status not null default 'requested',
  proposed_slot jsonb,
  confirmed_at timestamptz,
  decline_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table visit_notes (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references visit_requests(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index members_cell_idx on members (cell_id);
create index visits_member_status_idx on visit_requests (member_id, status);
create index notifications_profile_idx on notifications (profile_id, read_at);

-- 가입 시 profiles 자동 생성 (카카오 닉네임 보존)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, kakao_nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
