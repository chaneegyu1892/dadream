# 다드림 (dadream)

> 제자광성교회 청년부 대시보드. 카카오 OAuth + 임원 승인제 + RLS-퍼스트 비공개 그룹웨어.

## 한 줄 요약

Next.js 16 App Router + React 19 + Supabase (Postgres + Auth Kakao + Storage) + Tailwind 4 + Radix UI. PWA 기반(서비스워커 도입 전).

## 빠른 시작

```bash
# 1) 의존성
npm install

# 2) 환경변수
cp .env.example .env.local
# .env.local에 Supabase URL/anon key 채우기 (대시보드 Settings → API)

# 3) 개발 서버
npm run dev
# → http://localhost:3000
```

### Supabase DB 작업

```bash
# 한 번만: 프로젝트 연결
cp .env.example .env.local
# .env.local에 SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN 채우기
npm run db:link

# 이후
npm run db:status   # 원격/로컬 마이그레이션 상태
npm run db:push     # 로컬 마이그 → 원격
npm run db:pull     # 원격 → 로컬
npm run db:diff     # 스키마 차이
npm run db:types    # src/types/supabase.gen.ts 재생성
```

> `scripts/db.sh`가 `.env.local`을 자동 로드하고 60초 timeout을 강제한다.
> 자세한 규약은 [AGENTS.md](./AGENTS.md) 참고.

## 핵심 컨셉

### 권한의 진실 공급원은 DB

- **RLS** (`supabase/migrations/0002_rls.sql`) — 모든 테이블에 row-level security
- **트리거** (`0016`, `0017`) — role/approval 변경 시 privilege escalation 방지
- `src/lib/roles.ts`는 **UI 보조용**(보이기/숨기기)일 뿐. 권한 체크는 무조건 DB.

### 4단계 역할

`member` (0) → `officer` (1) → `staff` (2) → `pastor` (3).
`role_at_least(min)` / `role_rank()`로 비교 (`src/lib/roles.ts`).

### 데이터 분리

| 테이블 | 누가 보나 | 내용 |
|---|---|---|
| `members` | 모든 인증 사용자 | 이름, 사진경로, 셀, 직분, 활성 여부 |
| `member_private` | staff+ 또는 본인 | 주소, 직장, 가족 |
| `member_contact` | officer+ 또는 본인 | 전화, 생일, 세례 |
| `member_duty` | officer+ | 직분 텍스트 (legacy) |
| `visit_notes` | pastor | 목양 메모 |

사진은 비공개 버킷 + 12시간 signed URL 캐시 (`src/lib/photos.ts`).

### 캐시

- `unstable_cache` (Next 16 표준 `'use cache'`/`cacheTag`는 마이그레이션 전)
- `STABLE_CACHE_SECONDS` = **30분** (권한 변경 반영 시간)
- keyParts는 **고정 prefix만** (Next 16 unstable_cache는 함수 인자를 invocationKey에 자동 포함)
- 무효화는 `src/lib/dashboard-cache-invalidation.ts`의 `revalidate*()` 헬퍼 사용

### 인증

- **카카오 OAuth** + 임원 승인제
- 가입 시 `pending` 자동 생성, 임원 승인 전까지 대시보드 진입 불가
- 콜백 redirect origin은 **화이트리스트** (`src/lib/auth-redirect.ts`)
- 환경변수 `NEXT_PUBLIC_SITE_URL` (프로덕션 필수, dev는 localhost fallback)

## 마이그레이션 표

`supabase/migrations/` 누적 적용. 번호 순서대로 실행.

| # | 파일 | 내용 |
|---|---|---|
| 0001 | schema | 기본 스키마 (user_role, approval_status, visit_status enum, profiles/events/visits 등) |
| 0002 | rls | RLS 헬퍼(current_app_role, role_rank, role_at_least, my_member_id) + 정책 |
| 0003 | security_hardening | 보안 헤더, 시크릿 정리 |
| 0004 | storage | Supabase Storage 정책 (member-photos 비공개 버킷) |
| 0005 | tiered_columns_and_notify | member_private/contact 분리 + push_notification/notify_pastors RPC |
| 0006 | member_gender_registered | 명부 성별/등록일 컬럼 |
| 0007 | phase2 | 심방/방문 노트 확장 |
| 0008 | performance_indexes | 검색/조회 인덱스 |
| 0009 | transactional_rpcs | approve_profile_tx / add_meeting_item_tx / add_service_role_tx |
| 0010 | event_colors | 일정 색상 |
| 0011 | self_profile_edit | 본인 프로필 편집 |
| 0012 | consolidate_self_profile_policies | 0011 정책 정리 |
| 0013 | member_duties | 명부 직분 |
| 0014 | consolidate_member_duty_policies | 0013 정책 정리 |
| 0015 | split_member_roles | members.duty → cell_role + officer_position 분리 (duty는 레거시 보존) |
| 0016 | profiles_privilege_escalation_guard | profiles.role/approval 변경 가드 트리거 |
| 0017 | approve_profile_tx_self_guard | approve_profile_tx self-approval + role hierarchy 검증 |

> 이전에 원격 DB에 timestamp 마이그(20260610…) 14개가 별도로 적용돼 있다.
> `supabase db pull`로 이력 정렬 가능. SQL 파일 자체는 위 표가 진실.

## 빌드 / 테스트

```bash
npm run lint          # eslint
npm run test          # vitest (21 파일, 100+ 테스트)
npm run build         # Next 16 빌드
npm run test:e2e      # Playwright (먼저 npm run test:e2e:install)
```

### 빌드 게이트

- `npm run lint` 0 errors
- `npm run test` 100+ tests pass
- `npm run build` 성공

## 디렉토리

```
src/
  app/
    (dashboard)/    # 로그인 후 화면 (라우트 그룹, layout에서 세션 검증)
    auth/callback/  # OAuth 콜백
    offline/      # 오프라인 안내 (PWA navigate fallback)
  components/       # 재사용 UI
  lib/              # 도메인 로직 (auth, roles, dashboard-query, photos, …)
  types/            # Database 타입 (수동 or npm run db:types)
supabase/
  migrations/       # 누적 SQL (0001..0017.sql)
  config.toml       # Supabase CLI 설정
scripts/
  db.sh             # .env.local 자동 로드 + db:* 진입점
e2e/                # Playwright 시나리오
public/
  offline.html    # 정적 오프라인 fallback
```

## 환경변수

| 이름 | 용도 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | O |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon JWT | O |
| `NEXT_PUBLIC_SITE_URL` | OAuth 콜백 redirect origin 화이트리스트 | O (prod) |
| `SUPABASE_PROJECT_REF` | Supabase CLI 프로젝트 ref (DB 작업 시) | dev 선택 |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI access token (DB 작업 시) | dev 선택 |

`.env.local`은 `.gitignore` 처리됨. 토큰 회전: [Supabase 대시보드](https://app.supabase.com/account/tokens).

## 더 보기

- [AGENTS.md](./AGENTS.md) — 에이전트/AI 협업 규칙 (Next 16 주의, RLS 진실 공급원, 캐시 정책, DB 작업 규약)
- [다드림 GitHub](https://github.com/chaneegyu1892/dadream)
