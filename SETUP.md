# SETUP.md — セットアップ手順

新規環境での構築手順。  
所要時間の目安: 約 30〜60 分（各サービスのアカウント作成済みの場合）

---

## 前提条件

- Node.js 18 以上
- Git
- 以下のアカウントが作成済みであること
  - [LINE Developers](https://developers.line.biz/) — Messaging API チャネル
  - [Anthropic Console](https://console.anthropic.com/) — API キー
  - [Supabase](https://supabase.com/) — プロジェクト
  - [Vercel](https://vercel.com/) — デプロイ先

---

## Step 1: リポジトリをクローン

```bash
git clone https://github.com/yumiozaki358-cloud/line-bot-salon.git
cd line-bot-salon
npm install
```

---

## Step 2: LINE Developers Console の設定

1. [LINE Developers Console](https://developers.line.biz/) にログイン
2. プロバイダー → チャネル（Messaging API）を選択
3. 以下の値をメモしておく

| 取得する値 | 場所 |
|---|---|
| Channel secret | 「チャネル基本設定」タブ |
| Channel access token（長期） | 「Messaging API 設定」タブ → 発行ボタン |

4. 「Messaging API 設定」→「Webhook URL」は **Step 5** のデプロイ後に設定する
5. 「応答設定」→「応答メッセージ」を **オフ**、「Webhook」を **オン** にする

---

## Step 3: Supabase の設定

### 3-1. プロジェクト作成

1. [Supabase](https://supabase.com/) にログインしてプロジェクトを作成
2. 「Project Settings」→「API」から以下をメモ

| 取得する値 | 場所 |
|---|---|
| Project URL | `https://xxxx.supabase.co` |
| service_role key | 「Project API keys」の `service_role` 欄 |

### 3-2. テーブル作成

「SQL Editor」を開き、以下のファイルを順番に実行する。

```
supabase/migrations/20260819_create_faq.sql
supabase/migrations/20260820_create_menus.sql
supabase/migrations/20260819_recreate_conversations_integer_confidence.sql
supabase/migrations/20260820_create_broadcasts.sql
```

各ファイルの内容を SQL Editor に貼り付けて「RUN」を押す。  
実行後、「Table Editor」に `faq` / `menus` / `conversations` / `broadcasts` の 4 テーブルが表示されれば成功。

> **注意**: `recreate_conversations_integer_confidence.sql` は DROP → CREATE を含む。  
> 本番稼働後に再実行すると既存データが失われるため注意。

---

## Step 4: 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を開いて各値を記入する。

```env
# LINE Messaging API
LINE_CHANNEL_SECRET=         # Step 2 で取得した Channel secret
LINE_CHANNEL_ACCESS_TOKEN=   # Step 2 で取得した Channel access token

# エスカレーション通知先（オーナーの LINE User ID）
OWNER_LINE_USER_ID=          # 取得方法は下記参照

# Anthropic
ANTHROPIC_API_KEY=           # Anthropic Console で発行した API キー

# Supabase
SUPABASE_URL=                # https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=   # service_role key

# 管理画面ログイン
ADMIN_PASSWORD=              # 任意のパスワード（英数字推奨）
```

### OWNER_LINE_USER_ID の取得方法

1. LINE Developers Console の「Messaging API 設定」→「Webhook URL」に任意の URL を一時的に設定
2. オーナーが LINE 公式アカウントにメッセージを送信
3. Vercel のログまたは `console.log` で `event.source.userId` を確認

または、デプロイ後にオーナーからメッセージを受信した際にログから取得してもよい。

---

## Step 5: Vercel へのデプロイ

### 5-1. プロジェクトをインポート

1. [Vercel](https://vercel.com/) にログイン
2. 「Add New Project」→ GitHub からリポジトリをインポート
3. フレームワークは自動で「Next.js」が選択される

### 5-2. 環境変数を設定

Vercel のプロジェクト設定 →「Environment Variables」で `.env.local` の内容をすべて登録する。

> **重要**: 環境変数を追加・変更した後は「Redeploy」が必要。変更直後のビルドには反映されない。

### 5-3. デプロイ実行

「Deploy」ボタンを押すと自動でビルドが始まる。  
完了後にデプロイ URL（`https://xxx.vercel.app`）が表示される。

---

## Step 6: LINE Webhook URL の設定

1. LINE Developers Console の「Messaging API 設定」タブを開く
2. 「Webhook URL」に以下を入力して「更新」

```
https://YOUR_VERCEL_URL.vercel.app/api/webhook
```

3. 「検証」ボタンを押し、「成功」と表示されることを確認
4. 「Webhookの利用」を **オン** にする

---

## Step 7: 動作確認

### 管理画面

1. `https://YOUR_VERCEL_URL.vercel.app/admin` にアクセス
2. `ADMIN_PASSWORD` で設定したパスワードでログイン
3. FAQ・メニューの追加・編集ができることを確認

### LINE Bot

1. LINE アプリで公式アカウントを友だち追加
2. 「営業時間は？」などを送信
3. AI が自動返信することを確認

### テストスクリプト（開発環境）

```bash
# サーバー起動中に別ターミナルで実行
npm run dev

# Claude 応答・応答時間の確認（LINE API 不使用）
node scripts/test-bot.mjs

# LINE 署名付き Webhook の E2E テスト
bash scripts/test-webhook.sh
```

---

## トラブルシューティング

| 症状 | 確認箇所 |
|---|---|
| 管理画面にログインできない | Vercel の環境変数 `ADMIN_PASSWORD` が設定されているか、デプロイ済みか |
| LINE 検証で 401 | `LINE_CHANNEL_SECRET` の値が正しいか |
| LINE 返信が来ない | Vercel ログで `External APIs` に outgoing request があるか確認 |
| Webhook 500 エラー | `ANTHROPIC_API_KEY` / `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` が設定済みか |
| ビルドエラー（Supabase fetch failed） | Vercel の環境変数が全て設定されているか確認してから再デプロイ |

詳細な技術仕様は [TECHNICAL.md](./TECHNICAL.md) を参照。
