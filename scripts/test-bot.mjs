#!/usr/bin/env node
/**
 * Bot response test — LINE API を呼ばずに Claude 応答を直接検証する
 *
 * Usage:
 *   node scripts/test-bot.mjs
 *
 * Options (env vars):
 *   BOT_TEST_URL   テスト対象 URL (default: http://localhost:3000/api/test/webhook)
 *   THRESHOLD_MS   応答時間の許容上限 ms (default: 3000)
 *   TEST_SECRET    本番環境でテストする場合の x-test-secret ヘッダー値
 */

const TARGET_URL =
  process.env.BOT_TEST_URL ?? "http://localhost:3000/api/test/webhook";
const THRESHOLD_MS = parseInt(process.env.THRESHOLD_MS ?? "3000", 10);
const TEST_SECRET = process.env.TEST_SECRET ?? "";

// ── 色付き出力 ────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};
const pass = `${C.green}✓ PASS${C.reset}`;
const fail = `${C.red}✗ FAIL${C.reset}`;
const slow = `${C.yellow}△ SLOW${C.reset}`;

// ── テストケース ──────────────────────────────────────────────────────────
const CASES = [
  { message: "営業時間は？" },
  { message: "カットの料金を教えてください" },
  { message: "予約はできますか？" },
  { message: "駐車場はありますか？" },
  { message: "xyzzy" }, // FAQ に該当しない → エスカレーション期待
];

// ── 確信度ラベル ──────────────────────────────────────────────────────────
function confidenceLabel(c) {
  if (c >= 8) return `${C.green}${c}/10 自動回答${C.reset}`;
  if (c >= 6) return `${C.yellow}${c}/10 要確認${C.reset}`;
  return `${C.red}${c}/10 未回答・エスカレーション${C.reset}`;
}

// ── 1件テスト ────────────────────────────────────────────────────────────
async function runTest(message) {
  const headers = { "Content-Type": "application/json" };
  if (TEST_SECRET) headers["x-test-secret"] = TEST_SECRET;

  const t0 = performance.now();

  let res, data;
  try {
    res = await fetch(TARGET_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(20_000),
    });
    data = await res.json();
  } catch (err) {
    const elapsed = Math.round(performance.now() - t0);
    return { ok: false, message, elapsed, error: String(err) };
  }

  const elapsed = Math.round(performance.now() - t0);

  if (!res.ok) {
    return { ok: false, message, elapsed, error: `HTTP ${res.status}: ${JSON.stringify(data)}` };
  }

  return { ok: true, message, elapsed, ...data };
}

// ── メイン ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}=== Bot Response Test ===${C.reset}`);
  console.log(`${C.gray}Target   : ${TARGET_URL}${C.reset}`);
  console.log(`${C.gray}Threshold: ${THRESHOLD_MS} ms${C.reset}\n`);

  let passed = 0;
  let failed = 0;

  for (const { message } of CASES) {
    process.stdout.write(`「${message}」 ... `);

    const r = await runTest(message);

    if (!r.ok) {
      console.log(fail);
      console.log(`   ${C.red}${r.error}${C.reset}\n`);
      failed++;
      continue;
    }

    const withinLimit = r.elapsed <= THRESHOLD_MS;
    const timeStr = withinLimit
      ? `${C.green}${r.elapsed} ms ✓${C.reset}`
      : `${C.yellow}${r.elapsed} ms  ← ${THRESHOLD_MS} ms 超過${C.reset}`;

    if (withinLimit) {
      console.log(pass);
      passed++;
    } else {
      console.log(slow);
      failed++;
    }

    console.log(`   応答時間 : ${timeStr}`);
    console.log(`   確信度   : ${confidenceLabel(r.confidence)}${r.escalated ? "  ⚠ エスカレーション" : ""}`);
    console.log(`   回答     : ${r.answer}`);
    console.log();
  }

  console.log("─".repeat(44));
  const summary = passed === CASES.length
    ? `${C.green}${C.bold}全 ${CASES.length} 件 PASS${C.reset}`
    : `${passed} 件 PASS  ${C.red}${failed} 件 FAIL${C.reset}`;
  console.log(`Result: ${summary}\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
