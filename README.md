# 다드림 — 제자광성교회 청년부 대시보드

청년부 명부·심방·예배위원·임원회의를 한곳에서 관리하는 PWA 대시보드입니다.
모바일에서 홈 화면에 설치해 앱처럼 쓸 수 있습니다.

## 기술 스택

- **Next.js 16** (App Router, React Server Components) + **React 19**
- **Supabase** — Postgres + Auth(카카오 OAuth) + Storage + Realtime, RLS로 권한 강제
- **Tailwind CSS 4** + Radix UI(shadcn 스타일 컴포넌트)
- **Zod** 입력 검증 · **date-fns** 날짜 처리
- **Vitest** 단위 테스트 · **Vercel**(icn1) 배포

## 권한 모델

역할은 4단계이며 DB의 RLS 정책과 `src/lib/roles.ts`가 함께 강제합니다.

| 역할 | 설명 | 주요 권한 |
| --- | --- | --- |
| `member` (청년) | 일반 청년 | 명부 열람(기본 정보), 본인 심방 신청 |
| `officer` (임원) | 셀 임원 | 명부 편집, 연락처 열람, 관리 메뉴 |
| `staff` (부장·부감) | 부서 운영진 | 전체 심방 현황, 개인정보 열람 |
| `pastor` (목사님) | 교역자 | 심방 확정, 목양 메모 |

가입 후에는 `pending` 상태이며, 임원 이상이 승인해야 대시보드에 접근할 수 있습니다.

## 로컬 개발

```bash
npm install
npm run dev        # http://localhost:3000
```

### 환경변수 (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # publishable(anon) 키
```

검증 로직은 `src/lib/supabase/env.ts`에 있으며, 누락 시 시작 단계에서 실패합니다.

### 스크립트

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm run start   # 빌드 결과 실행
npm run lint    # ESLint
npm run test    # Vitest 단위 테스트
```

## 데이터베이스 (Supabase)

마이그레이션은 `supabase/migrations/`에 순서대로 들어 있습니다.

| 파일 | 내용 |
| --- | --- |
| `0001_schema.sql` | 기본 스키마(cells/members/profiles/visit_requests/notifications 등) + 가입 트리거 |
| `0002_rls.sql` | RLS 헬퍼 함수(`role_at_least` 등)와 테이블별 정책 |
| `0003_security_hardening.sql` | 함수 `search_path` 고정, 트리거 함수 EXECUTE 회수 |
| `0004_storage.sql` | 명부 사진 Storage 버킷·정책 |
| `0005_tiered_columns_and_notify.sql` | 연락처 분리 테이블 + 알림 발송 SECURITY DEFINER 함수 |
| `0006_member_gender_registered.sql` | 명부 컬럼 보강 |
| `0007_phase2.sql` | 결혼 예정·임원회의·예배위원 테이블 + RLS |
| `0008_performance_indexes.sql` | 화면 쿼리 패턴에 맞춘 인덱스 |
| `0009_transactional_rpcs.sql` | 다단계 쓰기를 묶는 트랜잭션 RPC(승인·회의항목·직책) |
| `0010_realtime_notifications.sql` | 알림 테이블 Realtime 퍼블리케이션 등록 |

CLI로 적용:

```bash
supabase db push
```

## PWA

- `src/app/manifest.ts` — 앱 매니페스트(아이콘·테마·standalone)
- `public/sw.js` — 서비스워커(오프라인 안내 화면, 정적 자산 캐싱)
- `src/components/service-worker-register.tsx` — 프로덕션에서 SW 등록

> 서비스워커는 `NODE_ENV=production`에서만 등록되므로, 오프라인 동작은 `npm run build && npm run start` 또는 배포 환경에서 확인하세요.

## 보안

- 모든 테이블은 RLS로 보호되며, 권한 판정은 `role_at_least()` 헬퍼 기준입니다.
- 다단계 쓰기는 트랜잭션 RPC로 원자성을 보장합니다(고아 레코드 방지).
- HTTP 응답 보안 헤더는 `next.config.ts`에서 설정합니다(클릭재킹·MIME 스니핑 차단, HSTS).
- 명부 사진은 서명 URL로만 접근하며 `src/lib/photos.ts`가 캐싱·갱신을 처리합니다.

## 디렉터리 개요

```
src/
  app/
    (dashboard)/      # 인증·승인 가드가 걸린 메인 영역
      admin/          # officer+ 전용 관리(승인·회의·결혼)
    login, pending, auth/callback
  components/         # UI 및 화면 컴포넌트
  lib/                # 도메인 로직(roles, visits, photos, supabase 등)
  types/              # DB·Supabase 타입
supabase/migrations/  # DB 스키마·RLS·RPC
tests/                # Vitest 단위 테스트
```
