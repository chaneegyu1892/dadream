<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 다드림(dadream) — 제자광성교회 청년부 대시보드

## 한 줄 요약
한국 교회 청년부 비공개 그룹웨어. Next.js 16 App Router + React 19 + Supabase(Postgres+Auth Kakao+Storage) + Tailwind 4 + Radix UI. PWA(서비스워커 미도입, 추후 도입 시 본 문서의 "캐시/오프라인" 절 참고).

## 권한의 진실 공급원 = DB
- RLS(`supabase/migrations/0002_rls.sql`)와 트리거(`0016_profiles_privilege_escalation_guard.sql`, `0017_approve_profile_tx_self_guard.sql`)가 강제선.
- `src/lib/roles.ts`는 UI 보조(보이기/숨기기) 용도. 권한 체크는 무조건 DB에 맡길 것.
- 4단계 역할: `member` (0) → `officer` (1) → `staff` (2) → `pastor` (3). `role_at_least(min)`/`role_rank()`로 비교.

## 주요 데이터 분리
- `members` (기본) | `member_private` (주소·직장·가족, staff+ 또는 본인) | `member_contact` (전화·생일·세례, officer+ 또는 본인)
- 사진은 비공개 버킷 + signed URL (`src/lib/photos.ts`, 12시간 인메모리 캐시, 30분 REFRESH_BUFFER)

## 캐시 (`src/lib/dashboard-data-cache.ts`)
- `unstable_cache` 사용 (Next 16은 `'use cache'`/`cacheTag`가 정식이지만 이 코드베이스는 아직 마이그레이션 전).
- **STABLE_CACHE_SECONDS = 30분**. 권한 변경(member→officer 등)을 최대 30분 내 반영.
- keyParts는 **고정 prefix만** 둔다. userId/role/accessToken은 함수 인자로 전달되어 invocationKey에 자동 포함된다. keyParts에 중복으로 넣지 말 것.
- 무효화: `src/lib/dashboard-cache-invalidation.ts`의 `revalidate*()` 함수 사용. 데이터 변경 Server Action에서는 반드시 호출.
  - `revalidateMemberCaches()` — 명부/셀 변경 시
  - `revalidateCalendarCaches()` — 일정/심방 확정 시
  - `revalidateHomeEventCaches()` — 일정 변경 시
  - `revalidateHomeServiceCaches()` — 예배위원 배정 변경 시

## 인증 / OAuth
- 카카오 OAuth + 임원 승인제. 가입 시 `pending` 트리거 자동 생성, 임원 승인 전까지 대시보드 진입 불가.
- 콜백: `src/app/auth/callback/route.ts`. redirect origin은 **반드시 화이트리스트**(`src/lib/auth-redirect.ts`, `NEXT_PUBLIC_SITE_URL` 기반)를 거친다. `new URL(request.url).origin`을 그대로 쓰지 말 것.
- 환경변수 `NEXT_PUBLIC_SITE_URL` 필수 (프로덕션). 미설정 시 dev fallback은 `http://localhost:3000`.

## Server Action / RPC
- 다단계 쓰기는 `supabase/migrations/0009_transactional_rpcs.sql`의 RPC (`approve_profile_tx`, `add_meeting_item_tx`, `add_service_role_tx`)로 원자 처리.
- `approve_profile_tx`는 `security invoker` + RLS 위임. 본체에서 self-approval + role hierarchy를 한 번 더 검증 (0017).

## 환경변수

### 진짜 값 (저장소 외부)
- `/root/dadream/.env.local` — 진짜 `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `NEXT_PUBLIC_SITE_URL`
- `.gitignore`에 `.env*` 등록되어 있어 커밋되지 않음
- 다른 프로젝트는 그쪽 디렉토리에 별도 `.env.local` 생성 (프로젝트별 격리)

### 사용법
```bash
npm run db:link   # 1회만 (Supabase 프로젝트 연결)
npm run db:status # 원격/로컬 마이그 상태
npm run db:push   # 로컬 마이그 → 원격 적용
npm run db:pull   # 원격 → 로컬
npm run db:diff   # 원격 스키마와 로컬 마이그 차이
npm run db:types  # src/types/supabase.gen.ts 재생성
```

스크립트(`scripts/db.sh`)는 `.env.local`을 자동으로 로드한다. **Hermes가 토큰을 매번 요청하지 않는다**.

### 새 프로젝트 시작 시
1. `cp .env.example .env.local`
2. `.env.local`에 진짜 ref/token 채우기
3. `npm run db:link` 1회
4. 이후 자동

### 템플릿 (저장소 내부, 커밋 가능)
| 이름 | 위치 | 용도 |
|---|---|---|
| `SUPABASE_PROJECT_REF` | `.env.example` + `.env.local` | Supabase 프로젝트 ref (대시보드 URL의 `<ref>`) |
| `SUPABASE_ACCESS_TOKEN` | `.env.example` + `.env.local` | Supabase CLI access token (계정 단위) |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.example` + `.env.local` | Supabase 프로젝트 URL (Next.js 클라이언트용) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.example` + `.env.local` | anon JWT (Next.js 클라이언트용) |
| `NEXT_PUBLIC_SITE_URL` | `.env.example` + `.env.local` | OAuth 콜백 redirect origin 화이트리스트 (예: `https://dadream.example.com`) |

### 토큰 회전
- `https://app.supabase.com/account/tokens` → 기존 토큰 Revoke → 새 토큰 생성
- `.env.local`의 `SUPABASE_ACCESS_TOKEN`을 새 값으로 교체
- 다른 프로젝트의 `.env.local`도 모두 갱신 (계정 단위 토큰이라)

## 빌드 게이트
- `npm run lint` (eslint)
- `npm run test` (vitest, 21 파일 / 100+ 테스트)
- `npm run build` (Next 16)

## 디렉토리
- `src/app/(dashboard)/...` — 로그인 후 화면 (라우트 그룹, layout에서 세션 검증)
- `src/app/auth/callback/` — OAuth 콜백
- `src/app/__offline/` — 오프라인 안내 (PWA navigate fallback용, 현재는 수동 접근)
- `public/__offline.html` — 위와 동일한 정적 fallback
- `supabase/migrations/0001..0017.sql` — 누적 마이그레이션 (순서대로 적용)

## 마이그레이션 표
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

## 캐시/오프라인 (향후 PWA 도입 시)
- 본 코드베이스는 아직 `public/sw.js` / `manifest.webmanifest`가 없음. PWA 도입 시:
  1. `public/sw.js`의 navigate fallback으로 `/__offline` 반환
  2. `public/__offline.html` / `src/app/__offline/page.tsx`를 SPA fallback으로 사용
  3. 사진은 signed URL 12시간 캐시이므로 오프라인 시 12시간 동안 재사용 가능
