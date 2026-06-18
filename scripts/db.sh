#!/usr/bin/env bash
# 다드림 DB 작업 표준 진입점.
# - .env.local을 자동으로 로드 (없으면 친절한 안내)
# - 모든 subcommand에 동일한 로직 적용
# - 다른 프로젝트로 이식 시 이 스크립트와 .env.local 패턴만 복사
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# .env.local 자동 로드. 없으면 안내.
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
else
  echo "⚠️  .env.local이 없습니다. 생성 가이드:" >&2
  echo "    cp .env.example .env.local && vi .env.local" >&2
  echo "    SUPABASE_PROJECT_REF=... / SUPABASE_ACCESS_TOKEN=..." >&2
  exit 1
fi

if [ -z "${SUPABASE_PROJECT_REF:-}" ] || [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "⚠️  .env.local에 SUPABASE_PROJECT_REF / SUPABASE_ACCESS_TOKEN 필요" >&2
  exit 1
fi

# Supabase CLI는 자기 디렉토리에 .supabase/ 또는 supabase/.temp/ 캐시를 두므로
# 명령별로 재실행해도 안전. link는 한 번만.
ensure_link() {
  if [ ! -f supabase/.temp/project-ref ]; then
    npx supabase link --project-ref "$SUPABASE_PROJECT_REF" >/dev/null
  fi
}

cmd="${1:-help}"
shift || true

case "$cmd" in
  link)
    npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
    ;;
  status)
    ensure_link
    npx supabase migration list
    ;;
  diff)
    ensure_link
    npx supabase db diff "$@"
    ;;
  push)
    ensure_link
    npx supabase db push "$@"
    ;;
  pull)
    ensure_link
    npx supabase db pull "$@"
    ;;
  types)
    ensure_link
    npx supabase gen types typescript --linked > src/types/supabase.gen.ts
    echo "✓ src/types/supabase.gen.ts 갱신"
    ;;
  reset)
    ensure_link
    npx supabase db reset "$@"
    ;;
  help|--help|-h)
    cat <<EOF
다드림 DB 작업 도우미

사용법: npm run db:<명령> [-- supabase 옵션]
  link    Supabase 프로젝트 연결 (1회)
  status  원격/로컬 마이그레이션 상태
  diff    원격 스키마와 로컬 마이그 차이
  push    로컬 마이그를 원격에 적용 (CI에서도 사용)
  pull    원격 마이그/스키마를 로컬로
  types   src/types/supabase.gen.ts 재생성
  reset   로컬 DB 리셋 (개발용)

환경변수: .env.local
  SUPABASE_PROJECT_REF
  SUPABASE_ACCESS_TOKEN
  (NEXT_PUBLIC_SITE_URL 등 다른 변수도 자동 로드됨)
EOF
    ;;
  *)
    echo "알 수 없는 명령: $cmd" >&2
    exit 1
    ;;
esac
