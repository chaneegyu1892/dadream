# 다드림 대시보드 1차 MVP 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카카오 로그인 + 승인제, 권한별 청년 명부, 심방 신청·확정 캘린더를 갖춘 MVP를 Vercel에 배포한다.

**Architecture:** Next.js App Router 단일 프로젝트. Supabase가 인증(Kakao OAuth)·DB(PostgreSQL + RLS)·사진 스토리지를 담당. 권한 검증은 RLS이 DB 차원에서 강제하고, 화면은 역할별로 필드를 차등 노출. 명부(members)와 계정(profiles)을 분리하고 가입 승인 시 연결.

**Tech Stack:** Next.js 15+ (App Router, TS), Supabase (@supabase/ssr), Tailwind CSS v4 + shadcn/ui, Vitest, Vercel

**Spec:** [2026-06-10-dadream-dashboard-design.md](../specs/2026-06-10-dadream-dashboard-design.md)

---

## 파일 구조 (MVP)

```
src/
  lib/
    supabase/client.ts        -- 브라우저 클라이언트
    supabase/server.ts        -- 서버 클라이언트 (cookies)
    supabase/middleware.ts    -- 세션 갱신
    auth.ts                   -- 현재 사용자/역할 조회 헬퍼
    roles.ts                  -- 역할 서열, 필드 가시성 (순수 로직)
    matching.ts               -- 가입자-명부 매칭 후보 (순수 로직)
    visits.ts                 -- 심방 상태 전이 규칙 (순수 로직)
  middleware.ts               -- 인증 라우팅 가드
  app/
    login/page.tsx            -- 카카오 로그인
    auth/callback/route.ts    -- OAuth 콜백
    pending/page.tsx          -- 승인 대기 안내
    (dashboard)/layout.tsx    -- 인증된 영역 공통 셸 + 내비
    (dashboard)/page.tsx      -- 홈
    (dashboard)/members/page.tsx          -- 명부 그리드
    (dashboard)/members/[id]/page.tsx     -- 상세 (권한 차등)
    (dashboard)/visits/page.tsx           -- 캘린더 + 심방 목록
    (dashboard)/visits/new/page.tsx       -- 심방 신청
    (dashboard)/admin/approvals/page.tsx  -- 가입 승인 + 명부 연결
  components/ ...             -- 페이지별 클라이언트 컴포넌트
supabase/migrations/          -- SQL 마이그레이션 (MCP로 적용, 파일로도 보관)
tests/                        -- Vitest 단위 테스트 (순수 로직 대상)
```

---

### Task 1: 프로젝트 스캐폴드

**Files:** Create: 전체 Next.js 스캐폴드, `vitest.config.ts`

- [ ] **Step 1:** `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --turbopack --yes` (기존 docs/ 보존 주의 — 비어있지 않으므로 임시 디렉토리에 생성 후 이동하거나 `--yes` 충돌 시 수동 병합)
- [ ] **Step 2:** 의존성: `npm i @supabase/supabase-js @supabase/ssr date-fns && npm i -D vitest @vitejs/plugin-react`
- [ ] **Step 3:** `npx shadcn@latest init -y` 후 `npx shadcn@latest add button card input badge avatar dialog select textarea tabs table`
- [ ] **Step 4:** `vitest.config.ts` 작성, `package.json`에 `"test": "vitest run"` 추가
- [ ] **Step 5:** `npm run build` 통과 확인 후 커밋 `chore: Next.js + shadcn/ui + Vitest 스캐폴드`

### Task 2: Supabase 프로젝트 연결 및 환경 변수

**Files:** Create: `.env.local`, `.env.example`, `src/lib/supabase/{client,server,middleware}.ts`, `src/middleware.ts`

- [ ] **Step 1:** Supabase MCP `get_project_url`로 연결된 프로젝트 확인. **다른 프로젝트(예: im_dealer)면 중단하고 사용자에게 다드림용 신규 프로젝트 생성 요청.**
- [ ] **Step 2:** `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 기입 (`get_publishable_keys` 사용), `.env.example`엔 키 이름만. `.gitignore`에 `.env.local` 확인.
- [ ] **Step 3:** 클라이언트 3종 작성:

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

```ts
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component에서 호출된 경우 — middleware가 세션을 갱신하므로 무시 가능
          }
        },
      },
    },
  );
}
```

```ts
// src/middleware.ts — @supabase/ssr 공식 패턴: 세션 갱신 + 미로그인 시 /login 리다이렉트
// matcher: ['/((?!_next/static|_next/image|favicon.ico|login|auth).*)']
```

- [ ] **Step 4:** 빌드 통과 확인, 커밋 `feat: Supabase 클라이언트 및 인증 미들웨어`

### Task 3: DB 스키마 마이그레이션

**Files:** Create: `supabase/migrations/0001_schema.sql` (Supabase MCP `apply_migration`으로 적용)

- [ ] **Step 1:** 마이그레이션 작성·적용:

```sql
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

create index on members (cell_id);
create index on visit_requests (member_id, status);
create index on notifications (profile_id, read_at);

-- 가입 시 profiles 자동 생성
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
```

- [ ] **Step 2:** `list_tables`로 테이블 생성 확인, SQL 파일 커밋 `feat: 스키마 마이그레이션`

### Task 4: RLS 정책

**Files:** Create: `supabase/migrations/0002_rls.sql`

- [ ] **Step 1:** 헬퍼 + 정책 작성·적용:

```sql
-- 승인된 사용자의 역할 조회 (RLS 우회용 security definer)
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

-- member_private: staff+ 또는 본인
create policy private_select on member_private for select
  using (role_at_least('staff') or member_id = my_member_id());
create policy private_write on member_private for all using (role_at_least('staff'));

-- profiles: 본인 열람 + officer+ 전체 열람/승인 처리
create policy profiles_self on profiles for select using (id = auth.uid());
create policy profiles_admin_select on profiles for select using (role_at_least('officer'));
create policy profiles_admin_update on profiles for update using (role_at_least('officer'));

-- visit_requests: 본인 것 + staff/pastor 전체, 생성은 승인된 사용자
create policy visits_select on visit_requests for select
  using (role_at_least('staff') or member_id = my_member_id() or requested_by = auth.uid());
create policy visits_insert on visit_requests for insert
  with check (role_at_least('member'));
create policy visits_update_own on visit_requests for update
  using (member_id = my_member_id() or requested_by = auth.uid());
create policy visits_update_admin on visit_requests for update using (role_at_least('staff'));

-- visit_notes: 목사님 전용
create policy notes_all on visit_notes for all using (role_at_least('pastor'));

-- notifications: 본인 것만
create policy notif_select on notifications for select using (profile_id = auth.uid());
create policy notif_update on notifications for update using (profile_id = auth.uid());
```

> 참고: 알림 생성과 `members` 일부 필드(연락처·생일)의 열람 차등은 Server Action에서 select 컬럼을 역할별로 제한해 처리한다. member 역할이 직접 REST로 연락처 컬럼을 읽는 것까지 막으려면 2차에서 컬럼 분리 뷰로 보강한다 — MVP에서는 연락처는 민감 등급으로 보아 `member_private`로 옮기지 않되, 명부 select를 뷰(`members_basic`)로 제공.

- [ ] **Step 2:** `members_basic` 뷰 추가 (member 역할 화면용: id, name, photo_path, cell_id, is_officer, duty):

```sql
create view members_basic with (security_invoker = false) as
  select id, name, photo_path, cell_id, is_officer, duty, active from members;
grant select on members_basic to authenticated;
```

- [ ] **Step 3:** `get_advisors`(security)로 RLS 경고 확인·해소, 커밋 `feat: RLS 정책`

### Task 5: 순수 로직 + 테스트 (TDD)

**Files:** Create: `src/lib/roles.ts`, `src/lib/matching.ts`, `src/lib/visits.ts`, `tests/{roles,matching,visits}.test.ts`

- [ ] **Step 1:** 실패하는 테스트 먼저 작성:

```ts
// tests/roles.test.ts
import { describe, expect, it } from 'vitest';
import { roleAtLeast, visibleFields } from '@/lib/roles';

describe('roleAtLeast', () => {
  it('pastor ≥ staff ≥ officer ≥ member 서열을 따른다', () => {
    expect(roleAtLeast('pastor', 'staff')).toBe(true);
    expect(roleAtLeast('officer', 'staff')).toBe(false);
    expect(roleAtLeast('member', 'member')).toBe(true);
  });
});

describe('visibleFields', () => {
  it('member는 기본 필드만 본다', () => {
    expect(visibleFields('member', false)).toEqual(['name', 'photo', 'cell', 'duty', 'is_officer']);
  });
  it('officer는 연락처·생일까지 본다', () => {
    expect(visibleFields('officer', false)).toContain('phone');
    expect(visibleFields('officer', false)).not.toContain('address');
  });
  it('staff/pastor와 본인은 전체를 본다', () => {
    expect(visibleFields('staff', false)).toContain('address');
    expect(visibleFields('member', true)).toContain('address');
  });
});
```

```ts
// tests/matching.test.ts
import { describe, expect, it } from 'vitest';
import { matchCandidates } from '@/lib/matching';

const roster = [
  { id: '1', name: '김민수' },
  { id: '2', name: '김민수' },
  { id: '3', name: '박지은' },
];

describe('matchCandidates', () => {
  it('정확히 일치하는 이름을 전부 반환한다 (동명이인)', () => {
    expect(matchCandidates('김민수', roster).map((m) => m.id)).toEqual(['1', '2']);
  });
  it('닉네임에 섞인 공백·특수문자를 무시하고 부분 일치한다', () => {
    expect(matchCandidates('박지은 ♥', roster).map((m) => m.id)).toEqual(['3']);
  });
  it('일치가 없으면 빈 배열', () => {
    expect(matchCandidates('홍길동', roster)).toEqual([]);
  });
});
```

```ts
// tests/visits.test.ts
import { describe, expect, it } from 'vitest';
import { canTransition } from '@/lib/visits';

describe('canTransition', () => {
  it('requested → confirmed/proposed/declined/cancelled 허용', () => {
    expect(canTransition('requested', 'confirmed')).toBe(true);
    expect(canTransition('requested', 'proposed')).toBe(true);
  });
  it('완료/반려/취소는 종결 상태', () => {
    expect(canTransition('completed', 'confirmed')).toBe(false);
    expect(canTransition('declined', 'requested')).toBe(false);
  });
  it('confirmed → completed/cancelled만 허용', () => {
    expect(canTransition('confirmed', 'completed')).toBe(true);
    expect(canTransition('confirmed', 'proposed')).toBe(false);
  });
});
```

- [ ] **Step 2:** `npm test` → 전부 FAIL 확인
- [ ] **Step 3:** 최소 구현:

```ts
// src/lib/roles.ts
export type UserRole = 'member' | 'officer' | 'staff' | 'pastor';

const ROLE_RANK: Record<UserRole, number> = { member: 0, officer: 1, staff: 2, pastor: 3 };

export function roleAtLeast(role: UserRole, min: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

const BASIC = ['name', 'photo', 'cell', 'duty', 'is_officer'] as const;
const OFFICER_EXTRA = ['phone', 'birth_date', 'baptized'] as const;
const FULL_EXTRA = ['address', 'workplace', 'family_info', 'visit_history'] as const;

export function visibleFields(role: UserRole, isSelf: boolean): string[] {
  if (isSelf || roleAtLeast(role, 'staff')) return [...BASIC, ...OFFICER_EXTRA, ...FULL_EXTRA];
  if (roleAtLeast(role, 'officer')) return [...BASIC, ...OFFICER_EXTRA];
  return [...BASIC];
}
```

```ts
// src/lib/matching.ts
type RosterEntry = { id: string; name: string };

function normalize(value: string): string {
  return value.replace(/[^가-힣a-zA-Z]/g, '');
}

export function matchCandidates<T extends RosterEntry>(kakaoName: string, roster: T[]): T[] {
  const target = normalize(kakaoName);
  if (!target) return [];
  const exact = roster.filter((m) => normalize(m.name) === target);
  if (exact.length > 0) return exact;
  return roster.filter((m) => target.includes(normalize(m.name)));
}
```

```ts
// src/lib/visits.ts
export type VisitStatus = 'requested' | 'proposed' | 'confirmed' | 'completed' | 'declined' | 'cancelled';

const TRANSITIONS: Record<VisitStatus, readonly VisitStatus[]> = {
  requested: ['confirmed', 'proposed', 'declined', 'cancelled'],
  proposed: ['confirmed', 'declined', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  declined: [],
  cancelled: [],
};

export function canTransition(from: VisitStatus, to: VisitStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
```

- [ ] **Step 4:** `npm test` → PASS, 커밋 `feat: 역할·매칭·심방 상태 로직 (TDD)`

### Task 6: 로그인 / 콜백 / 승인 대기

**Files:** Create: `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/pending/page.tsx`, `src/lib/auth.ts`

- [ ] **Step 1:** 로그인 페이지 — 카카오 버튼 1개, `signInWithOAuth({ provider: 'kakao', options: { redirectTo: `${origin}/auth/callback` } })`
- [ ] **Step 2:** 콜백 라우트 — `exchangeCodeForSession(code)` 후 `/`로 리다이렉트, 실패 시 `/login?error=...`
- [ ] **Step 3:** `src/lib/auth.ts` — `getSessionProfile()`: user + profile 조회, 미승인이면 `pending` 반환. `(dashboard)/layout.tsx`에서 호출해 `pending`이면 `/pending`으로, 미로그인이면 `/login`으로 redirect.
- [ ] **Step 4:** `/pending` — "가입 요청이 접수되었어요. 임원 승인 후 이용할 수 있어요" 안내 + 로그아웃 버튼
- [ ] **Step 5:** Supabase 대시보드에 Kakao provider 설정(사용자 작업: REST API 키·시크릿). 로컬 수동 확인 후 커밋 `feat: 카카오 로그인 및 승인 대기 흐름`

### Task 7: 대시보드 셸 + 내비게이션

**Files:** Create: `src/app/(dashboard)/layout.tsx`, `src/components/nav.tsx`

- [ ] **Step 1:** 모바일: 하단 탭바(홈/캘린더/명부/관리), 데스크톱: 사이드바. `관리` 메뉴는 officer+에게만 렌더.
- [ ] **Step 2:** 빌드 확인, 커밋 `feat: 대시보드 셸`

### Task 8: 가입 승인 + 명부 연결 (관리)

**Files:** Create: `src/app/(dashboard)/admin/approvals/page.tsx`, `src/components/approval-card.tsx`, Server Actions `src/app/(dashboard)/admin/approvals/actions.ts`

- [ ] **Step 1:** pending 프로필 목록 조회, 각 카드에 `matchCandidates(kakao_nickname, 전체 명부)` 결과를 후보 select로 표시 (없으면 "명부에 새로 추가" 옵션).
- [ ] **Step 2:** Server Action `approveProfile({ profileId, memberId | newMember: { name, cellId }, role })`:
  - 입력 검증(zod) → `profiles.approval='approved'`, `member_id` 연결 (또는 members insert 후 연결), 역할 지정
  - 알림 insert (`가입이 승인되었어요`)
  - 실패 시 사용자 친화적 에러 메시지 반환
- [ ] **Step 3:** 거절 액션 (`approval='rejected'`). 수동 검증 후 커밋 `feat: 가입 승인 및 명부 연결`

### Task 9: 청년 명부

**Files:** Create: `src/app/(dashboard)/members/page.tsx`, `[id]/page.tsx`, `src/components/member-card.tsx`

- [ ] **Step 1:** 그리드 페이지 — 역할이 member면 `members_basic` 뷰, officer+면 `members` 테이블 조회. 이름 검색(클라이언트 필터) + 셀 필터. 사진은 `createSignedUrl(photo_path, 3600)`.
- [ ] **Step 2:** 상세 페이지 — `visibleFields(role, isSelf)`로 표시 필드 결정. staff+/본인이면 `member_private`, 심방 이력 join. officer+에게 편집 버튼.
- [ ] **Step 3:** 명부 수기 추가/수정 폼 (officer+). 커밋 `feat: 청년 명부 (권한별 차등 열람)`

### Task 10: 심방 신청

**Files:** Create: `src/app/(dashboard)/visits/new/page.tsx`, `actions.ts`

- [ ] **Step 1:** 신청 폼 — 희망 슬롯(날짜 + 오전/오후/저녁, 최대 3개), 나눔 내용 textarea. officer+는 "대상 청년" select로 대리 신청 가능 (기본은 본인).
- [ ] **Step 2:** Server Action `createVisitRequest` — zod 검증, insert, 목사님(profiles where role='pastor')에게 알림 insert. 커밋 `feat: 심방 신청`

### Task 11: 심방 관리 (목사님) + 캘린더

**Files:** Create: `src/app/(dashboard)/visits/page.tsx`, `src/components/{visit-calendar,visit-list,visit-actions}.tsx`, `visits/actions.ts`

- [ ] **Step 1:** 월간 캘린더(date-fns 직접 구현, 외부 캘린더 라이브러리 없이) — events 전체 + 본인 권한으로 보이는 visit_requests(confirmed) 표시.
- [ ] **Step 2:** 목사님 뷰 — `requested` 목록에 [확정(슬롯 선택)] [다른 시간 제안] [반려(사유)] 버튼. Server Action에서 `canTransition` 검증 후 상태 변경 + 신청자 알림 insert.
- [ ] **Step 3:** 신청자 뷰 — `proposed` 상태면 [수락 → confirmed] [취소] 버튼.
- [ ] **Step 4:** 목사님 전용 목양 메모 (visit_notes CRUD, confirmed/completed 심방에서). 커밋 `feat: 심방 확정 흐름 및 캘린더`

### Task 12: 알림 + 홈

**Files:** Create: `src/components/notification-bell.tsx`, `src/app/(dashboard)/page.tsx`

- [ ] **Step 1:** 헤더 종 아이콘 + 미읽음 배지, 클릭 시 목록·읽음 처리.
- [ ] **Step 2:** 홈 — 다가오는 일정 7일, 내 심방 현황(목사님이면 대기 신청 수), 빠른 액션(심방 신청하기). 커밋 `feat: 알림 및 홈 대시보드`

### Task 13: 스토리지 + 시드 + 배포

- [ ] **Step 1:** 비공개 버킷 `member-photos` 생성 + RLS(authenticated 읽기는 signed URL로만, 업로드 officer+).
- [ ] **Step 2:** 셀 시드 데이터 (사용자 제공 후), 명부 엑셀 임포트 스크립트는 데이터 수령 후 별도.
- [ ] **Step 3:** `npm run build` + `npm test` 전체 통과 → Vercel 배포 (env 설정 포함) → Supabase Auth redirect URL에 배포 도메인 추가.
- [ ] **Step 4:** 최초 관리자 부트스트랩: 형규 계정을 SQL로 `role='officer', approval='approved'` 처리.

---

## Self-Review 결과

- 스펙 §3(인증·승인·연결) → Task 3,4,6,8 / §4.2(심방) → Task 10,11 / §4.3(명부) → Task 9 / §6(알림) → Task 12 ✓
- 2차 범위(예배위원, 임원회의, 결혼 리스트, 홈 완성)는 의도적으로 제외 — 별도 계획으로.
- 타입 일관성: `UserRole`·`VisitStatus`는 `src/lib/{roles,visits}.ts` 정의를 전 태스크에서 사용 ✓
