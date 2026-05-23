#!/usr/bin/env bash
# Smoke-test the Railway backend after deploy.
# Usage: bash deploy/smoke.sh https://your-railway-url
set -u

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <railway-url>"
  echo "  e.g.  $0 https://armstrong-arikat-api.up.railway.app"
  exit 2
fi

BASE="${1%/}"
PASS=0
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local pattern="${3:-}"
  local code
  local body
  code=$(curl -s -o /tmp/aaresp.json -w "%{http_code}" "$url" || echo "000")
  if [ "$code" != "200" ]; then
    echo "  FAIL  $label  (HTTP $code)"
    FAIL=$((FAIL+1))
    return
  fi
  if [ -n "$pattern" ]; then
    if grep -q "$pattern" /tmp/aaresp.json; then
      echo "  OK    $label"
      PASS=$((PASS+1))
    else
      echo "  FAIL  $label  (pattern \"$pattern\" not found)"
      echo "        body head: $(head -c 200 /tmp/aaresp.json)"
      FAIL=$((FAIL+1))
    fi
  else
    echo "  OK    $label"
    PASS=$((PASS+1))
  fi
}

echo
echo "==> Smoke testing $BASE"
echo

echo "Health & config:"
check "/health"             "$BASE/health"             '"status":"ok"'
check "/health (anthropic)" "$BASE/health"             '"anthropic_configured":true'
check "/health (polygon)"   "$BASE/health"             '"polygon_configured":true'
check "/health (supabase)"  "$BASE/health"             '"supabase_configured":true'

echo
echo "Agent roster (expect 25 specialists + 2 system = 27):"
check "/api/agents"        "$BASE/api/agents"         '"key"'

echo
echo "Healthcare endpoints (all should return 200 with empty arrays on fresh DB):"
check "/api/healthcare"                       "$BASE/api/healthcare"                       '"next_catalysts"'
check "/api/healthcare/clinical-catalysts"    "$BASE/api/healthcare/clinical-catalysts"    ''
check "/api/healthcare/pdufas"                "$BASE/api/healthcare/pdufas"                ''
check "/api/healthcare/glp1/latest"           "$BASE/api/healthcare/glp1/latest"           ''
check "/api/healthcare/glp1/history"          "$BASE/api/healthcare/glp1/history"          ''
check "/api/healthcare/pipeline"              "$BASE/api/healthcare/pipeline"              ''
check "/api/healthcare/patent-cliffs"         "$BASE/api/healthcare/patent-cliffs"         ''

echo
echo "Core dashboard endpoints:"
check "/api/market/snapshot"     "$BASE/api/market/snapshot"     ''
check "/api/top-50"              "$BASE/api/top-50"              ''
check "/api/regime"              "$BASE/api/regime"              ''
check "/api/reports/latest"      "$BASE/api/reports/latest"      ''
check "/api/reports/archive"     "$BASE/api/reports/archive"     ''

echo
echo "================================"
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"
echo "================================"

[ "$FAIL" -eq 0 ]
