#!/usr/bin/env bash
# 다드림 DB 작업 표준 진입점.
# - .env.local을 자동으로 로드 (없으면 친절한 안내)
# - 모든 subcommand에 동일한 로직 적용
# - 다른 프로젝트로 이식 시 이 스크립트와 .env.local 패턴만 복사
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 모든 CLI 호출은 timeout을 강제 (네트워크/DB hang 방지).
# 기본 60초. CI나 느린 환경에서 늘리려면 DB_TIMEOUT=120 npm run db:push
DB_TIMEOUT="${DB_TIMEOUT:-60}"
sb() {
  timeout "$DB_TIMEOUT" npx supabase "$@"
}

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

# Supabase CLI는 자기 디렉토리에 supabase/.temp/project-ref 캐시를 두므로
# link는 한 번만. 이후 모든 명령은 캐시된 연결 사용.
ensure_link() {
  if [ ! -f supabase/.temp/project-ref ]; then
    sb link --project-ref "$SUPABASE_PROJECT_REF" >/dev/null
  fi
}

cmd="${1:-help}"
shift || true

case "$cmd" in
  link)
    sb link --project-ref "$SUPABASE_PROJECT_REF"
    ;;
  status)
    ensure_link
    sb migration list
    ;;
  diff)
    ensure_link
    sb db diff "$@"
    ;;
  push)
    ensure_link
    sb db push "$@"
    ;;
  pull)
    ensure_link
    sb db pull "$@"
    ;;
  types)
    ensure_link
    sb gen types typescript --linked > src/types/supabase.gen.ts
    echo "✓ src/types/supabase.gen.ts 갱신"
    ;;
  reset)
    ensure_link
    sb db reset "$@"
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

옵션:
  DB_TIMEOUT=<초>  CLI 호출당 timeout (기본 60). hang 방지.
EOF
    ;;
  *)
    echo "알 수 없는 명령: $cmd" >&2
    exit 1
    ;;
esac
