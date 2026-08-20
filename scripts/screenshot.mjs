#!/usr/bin/env node
/**
 * 管理画面のスクリーンショットを撮影する
 * Usage: node scripts/screenshot.mjs
 */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../docs/screenshots");

const BASE_URL = "https://line-bot-salon-zeta.vercel.app";
const PASSWORD = "salon2026";

// モバイルサイズ（実際の利用環境に合わせて）
const VIEWPORT = { width: 390, height: 844 };

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  // ── ログイン ──────────────────────────────────────────
  console.log("Logging in...");
  await page.goto(`${BASE_URL}/admin`);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/admin/faq`);
  console.log("Login successful");

  // ── FAQ 管理 ──────────────────────────────────────────
  console.log("Capturing FAQ page...");
  await page.goto(`${BASE_URL}/admin/faq`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: `${OUT_DIR}/admin-faq.png`,
    fullPage: true,
  });
  console.log("  → admin-faq.png");

  // ── メニュー管理 ──────────────────────────────────────
  console.log("Capturing Menu page...");
  await page.goto(`${BASE_URL}/admin/menu`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: `${OUT_DIR}/admin-menu.png`,
    fullPage: true,
  });
  console.log("  → admin-menu.png");

  // ── 会話ログ ──────────────────────────────────────────
  console.log("Capturing Conversations page...");
  await page.goto(`${BASE_URL}/admin/conversations`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: `${OUT_DIR}/admin-conversations.png`,
    fullPage: true,
  });
  console.log("  → admin-conversations.png");

  // ── お知らせ配信 ──────────────────────────────────────
  console.log("Capturing Broadcast page...");
  await page.goto(`${BASE_URL}/admin/broadcast`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: `${OUT_DIR}/admin-broadcast.png`,
    fullPage: true,
  });
  console.log("  → admin-broadcast.png");

  // ── お知らせ配信（プレビュー状態） ────────────────────
  console.log("Capturing Broadcast preview state...");
  await page.fill("textarea", "明日10月12日（土）は臨時休業いたします。\nご不便をおかけして申し訳ございません。");
  await page.click("button:has-text('プレビューを見る')");
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${OUT_DIR}/admin-broadcast-preview.png`,
    fullPage: true,
  });
  console.log("  → admin-broadcast-preview.png");

  await browser.close();
  console.log("\nAll screenshots saved to docs/screenshots/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
