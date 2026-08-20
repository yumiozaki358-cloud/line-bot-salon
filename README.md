# LINE Bot サロン — AI 自動応答システム

美容室向けの LINE Bot + AI 自動応答システム。  
営業時間外を含むお客様からの問い合わせを AI が自動で回答し、  
オーナーの一次対応業務を大幅に削減します。

**本番 URL**: `https://YOUR_VERCEL_URL.vercel.app`

---

## スクリーンショット

### 管理画面

| FAQ 管理 | メニュー管理 | 会話ログ |
|---|---|---|
| [ここにスクリーンショット] | [ここにスクリーンショット] | [ここにスクリーンショット] |

### お知らせ配信

[ここにスクリーンショット（プレビュー → 確認 → 送信フロー）]

---

## 解決する課題

| Before | After |
|---|---|
| 1日 10〜15 件の問い合わせにすべて手動で返信 | FAQ に該当する質問の約 8 割を AI が即時返答 |
| 営業時間外の問い合わせへの対応が困難 | 24 時間・365 日自動応答 |
| 同じ質問が繰り返し来る（営業時間・料金など） | よくある質問をナレッジ化し、管理画面から随時更新可能 |
| 臨時休業のお知らせを個別に送る手間 | 友だち全員への一斉配信を数タップで完了 |

---

## 主な機能

### LINE Bot（自動応答）

- **FAQ 自動回答** — Claude AI が FAQ データベースと照合し、自然な日本語で返信
- **確信度判定** — 0〜10 の確信度スコアで回答品質を自動評価
  - スコア 6 以上: 自動返信
  - スコア 5 以下: オーナーに Push 通知してエスカレーション
- **エスカレーション** — AI が答えられない質問はオーナーの LINE に即時転送し、会話ログに記録

### 管理画面（`/admin`）

- **FAQ 管理** — 質問・回答・カテゴリの追加・編集・削除
- **メニュー管理** — サービス名・料金・説明の管理（スマートフォン対応 UI）
- **会話ログ閲覧** — 問い合わせ履歴・確信度・エスカレーション状態を一覧表示
- **お知らせ一斉配信** — 入力 → プレビュー → 確認ダイアログ → 全友だちへ送信の誤送信防止フロー

---

## 使用技術

| カテゴリ | 技術 |
|---|---|
| フレームワーク | [Next.js 16](https://nextjs.org/) (App Router / TypeScript / Server Components) |
| スタイリング | [Tailwind CSS v4](https://tailwindcss.com/) |
| AI | [Anthropic Claude API](https://www.anthropic.com/) (`claude-haiku-4-5`) |
| データベース | [Supabase](https://supabase.com/) (PostgreSQL / REST API) |
| LINE 連携 | [LINE Messaging API](https://developers.line.biz/) (Webhook / Reply / Push / Broadcast) |
| ホスティング | [Vercel](https://vercel.com/) (サーバーレス) |

### 技術選定の背景

- **Next.js + Vercel**: サーバーレス関数と静的配信を一元管理し、無料枠で運用可能
- **Supabase**: マネージド PostgreSQL。SDK を使わず REST API に直接 fetch することで依存を最小化
- **Claude Haiku**: 日本語の自然さとコスト（月 2,000〜3,000 円想定）のバランスが最適
- **LINE Messaging API**: 既存の公式アカウント（友だち約 300 人）をそのまま活用

---

## アーキテクチャ

```
LINE ユーザー（スマートフォン）
    │ メッセージ送信
    ▼
LINE Messaging API
    │ POST /api/webhook（HMAC-SHA256 署名検証）
    ▼
Next.js API Route（Vercel / Node.js Runtime）
    ├─ Supabase から FAQ データ取得
    ├─ Claude API で回答生成・確信度判定（0〜10）
    ├─ スコア >= 6  →  LINE Reply API で自動返信
    └─ スコア <= 5  →  LINE Push API でオーナー通知 + Supabase に記録

管理者（オーナー）
    │ ブラウザで /admin にアクセス
    ▼
管理画面（Next.js / パスワード認証）
    ├─ FAQ・メニューの CRUD
    ├─ 会話ログの閲覧
    └─ お知らせ一斉配信（LINE Broadcast API）
```

---

## 費用感

| 項目 | 費用 |
|---|---|
| Next.js ホスティング (Vercel) | 無料 |
| データベース (Supabase) | 無料 |
| LINE Messaging API | 無料（月 200 通まで Push 無料） |
| Claude API（想定: 月 300〜450 件） | 約 2,000〜3,000 円/月 |
| **合計** | **約 2,000〜3,000 円/月** |

---

## セットアップ

> 環境変数の設定・Supabase テーブル作成・Vercel デプロイ手順は **[SETUP.md](./SETUP.md)** を参照してください。  
> 開発・運用の技術詳細は **[TECHNICAL.md](./TECHNICAL.md)** を参照してください。

### クイックスタート（ローカル）

```bash
git clone https://github.com/yumiozaki358-cloud/line-bot-salon.git
cd line-bot-salon
npm install
cp .env.example .env.local   # 環境変数を記入
npm run dev                   # http://localhost:3000
```

### テスト実行

```bash
# Claude 応答・応答時間の確認（LINE API 不使用）
node scripts/test-bot.mjs

# LINE 署名付き Webhook の E2E テスト
bash scripts/test-webhook.sh
```

---

## ライセンス

[MIT](./LICENSE)
