#!/usr/bin/env bash
# Usage:
#   bash scripts/test-webhook.sh            # tests against http://localhost:3000
#   WEBHOOK_URL=https://xxx.vercel.app bash scripts/test-webhook.sh
#
# Requires: curl, openssl
# Reads LINE_CHANNEL_SECRET from .env.local automatically.

set -euo pipefail

# ── env ──────────────────────────────────────────────────────────────────────
if [ -f .env.local ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env.local | grep '=' | xargs)
fi

if [ -z "${LINE_CHANNEL_SECRET:-}" ]; then
  echo "ERROR: LINE_CHANNEL_SECRET is not set" >&2
  exit 1
fi

URL="${WEBHOOK_URL:-http://localhost:3000/api/webhook}"
PASS=0
FAIL=0

# ── helpers ──────────────────────────────────────────────────────────────────
sign() {
  echo -n "$1" | openssl dgst -sha256 -hmac "$LINE_CHANNEL_SECRET" -binary | base64
}

send() {
  local body="$1"
  local sig
  sig=$(sign "$body")
  local start end elapsed http_code

  start=$(date +%s%3N)
  http_code=$(curl -s -o /tmp/wh_response.txt -w "%{http_code}" \
    -X POST "$URL" \
    -H "Content-Type: application/json" \
    -H "x-line-signature: $sig" \
    --max-time 15 \
    -d "$body")
  end=$(date +%s%3N)
  elapsed=$(( end - start ))

  echo "$http_code $elapsed"
}

check() {
  local label="$1" http_code="$2" elapsed="$3" expect_code="${4:-200}" max_ms="${5:-10000}"

  local status="PASS"
  if [ "$http_code" != "$expect_code" ]; then
    status="FAIL (HTTP $http_code, expected $expect_code)"
    FAIL=$(( FAIL + 1 ))
  elif [ "$elapsed" -gt "$max_ms" ]; then
    status="SLOW (${elapsed}ms > ${max_ms}ms)"
    PASS=$(( PASS + 1 ))
  else
    PASS=$(( PASS + 1 ))
  fi

  printf "  [%-4s] %-40s %dms\n" "$status" "$label" "$elapsed"
}

# ── tests ────────────────────────────────────────────────────────────────────
echo ""
echo "=== LINE Webhook Tests ==="
echo "Target: $URL"
echo ""

# 1. LINE verification (empty events) — should be near-instant
BODY='{"destination":"Utest","events":[]}'
read -r code ms <<< "$(send "$BODY")"
check "空イベント（LINE検証リクエスト）" "$code" "$ms" "200" "500"

# 2. Bad signature — must be rejected
BAD_SIG="invalidsignature=="
code=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "x-line-signature: $BAD_SIG" \
  --max-time 5 \
  -d "$BODY")
if [ "$code" = "401" ]; then
  printf "  [PASS] %-40s\n" "不正な署名 → 401 拒否"
  PASS=$(( PASS + 1 ))
else
  printf "  [FAIL] %-40s HTTP %s\n" "不正な署名 → 401 拒否" "$code"
  FAIL=$(( FAIL + 1 ))
fi

# 3. Text message — full FAQ + Claude flow (costs ~1 API call)
BODY=$(cat <<'JSON'
{"destination":"Utest","events":[{"type":"message","replyToken":"noreply00000000000000000000000000","message":{"id":"1","type":"text","text":"営業時間を教えてください"},"source":{"type":"user","userId":"Utest001"},"timestamp":1234567890,"mode":"active"}]}
JSON
)
read -r code ms <<< "$(send "$BODY")"
check "FAQ質問（営業時間）" "$code" "$ms" "200" "10000"

# 4. Unknown question — should escalate
BODY=$(cat <<'JSON'
{"destination":"Utest","events":[{"type":"message","replyToken":"noreply00000000000000000000000000","message":{"id":"2","type":"text","text":"xyzzy無関係なこと123"},"source":{"type":"user","userId":"Utest002"},"timestamp":1234567891,"mode":"active"}]}
JSON
)
read -r code ms <<< "$(send "$BODY")"
check "不明な質問（エスカレーション想定）" "$code" "$ms" "200" "10000"

# 5. Non-text message (image) — should be silently ignored
BODY=$(cat <<'JSON'
{"destination":"Utest","events":[{"type":"message","replyToken":"noreply00000000000000000000000000","message":{"id":"3","type":"image"},"source":{"type":"user","userId":"Utest003"},"timestamp":1234567892,"mode":"active"}]}
JSON
)
read -r code ms <<< "$(send "$BODY")"
check "画像メッセージ（無視）" "$code" "$ms" "200" "1000"

# ── summary ──────────────────────────────────────────────────────────────────
echo ""
echo "Result: ${PASS} passed, ${FAIL} failed"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
