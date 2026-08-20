# TECHNICAL.md

美容室向け LINE Bot + AI 自動応答システムの技術仕様書。  
引き継ぎエンジニア向けに、実装上の判断理由・遭遇した問題も含めて記載する。

---

## 1. システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│  LINE ユーザー（スマートフォン）                               │
└───────────────────┬─────────────────────────────────────────┘
                    │ LINE メッセージ送信
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  LINE Messaging API                                          │
│  ・Webhook でイベントを POST 送信                             │
│  ・Reply API / Push API / Broadcast API で返信               │
│  ・Insight API でフォロワー数取得                             │
└───────────────────┬─────────────────────────────────────────┘
                    │ POST /api/webhook
                    │ x-line-signature ヘッダー付き
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16 (Vercel / Node.js Runtime)                      │
│                                                              │
│  app/api/webhook/route.ts                                    │
│  ├── 署名検証 (HMAC-SHA256)                                  │
│  ├── イベント種別判定                                         │
│  └── テキストメッセージ処理                                   │
│       ├── Supabase から FAQ 取得                              │
│       ├── Claude API で回答生成・確信度判定                   │
│       ├── confidence >= 6 → LINE Reply API で自動返信         │
│       └── confidence <= 5 → エスカレーション                  │
│            ├── LINE Push API でオーナーに通知                 │
│            └── Supabase conversations に記録                  │
│                                                              │
│  app/admin/ (管理画面)                                        │
│  ├── /admin          ログイン                                 │
│  ├── /admin/faq      FAQ 管理                                 │
│  ├── /admin/menu     メニュー管理                             │
│  ├── /admin/conversations  会話ログ閲覧                       │
│  └── /admin/broadcast      お知らせ配信                       │
└──────────┬────────────────────────┬────────────────────────-┘
           │                        │
           ▼                        ▼
┌──────────────────┐    ┌──────────────────────────────────────┐
│  Supabase        │    │  Anthropic Claude API                 │
│  (PostgreSQL)    │    │  モデル: claude-haiku-4-5-20251001    │
│  ・faq           │    │  max_tokens: 512                      │
│  ・menus         │    │  戻り値: { answer, confidence }       │
│  ・conversations │    │  (confidence: 0〜10 の整数)           │
│  ・broadcasts    │    └──────────────────────────────────────┘
└──────────────────┘
```

---

## 2. ディレクトリ構成

```
line-bot-salon/
├── app/
│   ├── api/
│   │   ├── webhook/route.ts          LINE Webhook 受信（メイン処理）
│   │   ├── admin/
│   │   │   ├── login/route.ts        ログイン（Cookie 発行）
│   │   │   ├── logout/route.ts       ログアウト（Cookie 削除）
│   │   │   ├── faq/
│   │   │   │   ├── route.ts          FAQ 一覧取得・新規作成
│   │   │   │   └── [id]/route.ts     FAQ 更新・削除
│   │   │   ├── menu/
│   │   │   │   ├── route.ts          メニュー一覧取得・新規作成
│   │   │   │   └── [id]/route.ts     メニュー更新・削除
│   │   │   ├── conversations/route.ts 会話ログ取得（read-only）
│   │   │   └── broadcast/route.ts    ブロードキャスト送信・履歴取得
│   │   └── test/
│   │       └── webhook/route.ts      テスト用エンドポイント（dev/TEST_SECRET）
│   └── admin/
│       ├── page.tsx                  ログイン画面（認証済みは /admin/faq へ）
│       ├── AdminShell.tsx            共通ヘッダー・ナビゲーション
│       ├── faq/page.tsx
│       ├── menu/page.tsx
│       ├── conversations/page.tsx
│       └── broadcast/page.tsx
├── lib/
│   ├── auth.ts                       Web Crypto API ベースのトークン管理
│   ├── claude.ts                     Claude API 呼び出し・レスポンス解析
│   ├── line.ts                       LINE Reply / Push / Broadcast / Insight API
│   ├── supabase.ts                   Supabase REST API ラッパー（SDK なし）
│   └── line/
│       ├── signature.ts              HMAC-SHA256 署名検証
│       └── types.ts                  LINE Webhook ペイロード型定義
├── middleware.ts                     /admin/:path+ の認証ガード
├── supabase/migrations/              DDL（適用済み、参照用）
└── scripts/
    ├── test-webhook.sh               LINE 署名付き Webhook テスト
    └── test-bot.mjs                  Claude 応答・応答時間テスト（LINE API 除外）
```

---

## 3. 環境変数

| 変数名 | 必須 | 説明 |
|---|---|---|
| `LINE_CHANNEL_SECRET` | ✓ | Webhook 署名検証・Reply/Push 送信に使用 |
| `LINE_CHANNEL_ACCESS_TOKEN` | ✓ | LINE Messaging API 全般の認証トークン |
| `OWNER_LINE_USER_ID` | ✓ | エスカレーション時の Push 通知先ユーザー ID |
| `ANTHROPIC_API_KEY` | ✓ | Claude API 認証キー |
| `SUPABASE_URL` | ✓ | Supabase プロジェクト URL（`https://xxx.supabase.co`）|
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Supabase Service Role キー（RLS をバイパスして読み書き）|
| `ADMIN_PASSWORD` | ✓ | 管理画面のログインパスワード |
| `TEST_SECRET` | 任意 | `/api/test/webhook` を本番環境で使う場合の共有シークレット |

**重要**: Vercel では環境変数を変更しても再デプロイしないと反映されない。  
`ADMIN_PASSWORD` を変更した際は必ずデプロイを実行すること。

---

## 4. API 仕様

### 4.1 LINE Webhook

#### `POST /api/webhook`

LINE プラットフォームからの Webhook を受信するエンドポイント。

**認証**: `x-line-signature` ヘッダー（HMAC-SHA256, Base64エンコード）

**リクエスト**:
```json
{
  "destination": "Uxxxxxxxxxxxx",
  "events": [
    {
      "type": "message",
      "replyToken": "noreply...",
      "message": { "id": "1", "type": "text", "text": "営業時間は？" },
      "source": { "type": "user", "userId": "Uxxxx" },
      "timestamp": 1234567890
    }
  ]
}
```

**レスポンス**: `200 OK` / `401 Unauthorized`（署名不正）

**処理の詳細**:
- `export const runtime = "nodejs"` — Node.js `crypto` モジュール使用のため必須
- `events` が空配列の場合（LINE の検証リクエスト）も 200 を返し正常終了
- テキスト以外のメッセージ（画像・スタンプ等）は無視
- `processEvents()` は必ず `await` する（後述「既知の注意点」参照）

---

### 4.2 管理画面 API

全エンドポイントの認証方式: httpOnly Cookie `admin_token` を検証（middleware + 各 route の二重チェック）

#### `POST /api/admin/login`

```
Request:  { "password": "..." }
Response: 200 { "ok": true } + Set-Cookie: admin_token=...
          401 { "error": "パスワードが違います" }
```

Cookie 属性: `httpOnly, secure（本番）, sameSite=strict, maxAge=604800（7日）`

#### `POST /api/admin/logout`

```
Response: 200 { "ok": true } + admin_token Cookie を削除
```

---

#### `GET /api/admin/faq`

```
Response: FaqRecord[]
```
```typescript
interface FaqRecord {
  id: number;
  question: string;
  answer: string;
  category: string;
}
```

#### `POST /api/admin/faq`

```
Request:  { "question": string, "answer": string, "category": string }
Response: 201 { "ok": true }
          400 { "error": "質問・回答・カテゴリは必須です" }
```

#### `PUT /api/admin/faq/[id]`

```
Request:  { "question": string, "answer": string, "category": string }
Response: 200 { "ok": true }
```

#### `DELETE /api/admin/faq/[id]`

```
Response: 200 { "ok": true }
```

---

#### `GET /api/admin/menu`

```
Response: MenuItem[]
```
```typescript
interface MenuItem {
  id: number;
  name: string;
  price: number;          // 円（整数）
  description: string | null;
}
```

#### `POST /api/admin/menu`

```
Request:  { "name": string, "price": number, "description"?: string }
Response: 201 { "ok": true }
          400 { "error": "..." }  // name 空 / price が整数でない・負数
```

#### `PUT /api/admin/menu/[id]` / `DELETE /api/admin/menu/[id]`

FAQ と同様のパターン。

---

#### `GET /api/admin/conversations`

```
Query:    ?limit=30&offset=0  (limit 上限: 100)
Response: ConversationRecord[]
```
```typescript
interface ConversationRecord {
  id: number;
  user_id: string;
  message: string;
  bot_response: string;
  confidence: number;     // 0〜10
  escalated: boolean;
  created_at: string;     // ISO 8601
}
```

---

#### `GET /api/admin/broadcast`

```
Response: BroadcastRecord[]  (最新20件)
```

#### `POST /api/admin/broadcast`

LINE Broadcast API（全友だち一斉送信）を呼び出し、`broadcasts` テーブルに記録する。

```
Request:  { "message": string, "recipientCount"?: number }
Response: 200 { "ok": true }
          400 { "error": "メッセージを入力してください" }
          500 { "error": "LINE設定が不完全です" }
```

---

#### `POST /api/test/webhook` （開発・テスト用）

LINE API を呼ばずに Claude 応答を返す。ローカル開発時または `TEST_SECRET` が一致する場合のみ動作。

```
Header:   x-test-secret: <TEST_SECRET>  （本番のみ必要）
Request:  { "message": string }
Response: {
  "message": string,
  "answer": string,
  "confidence": number,
  "escalated": boolean
}
```

---

## 5. DB 設計

Supabase の PostgreSQL を使用。SDK なし、REST API（PostgREST）を直接 fetch する。  
認証は `SUPABASE_SERVICE_ROLE_KEY` のみ（RLS は設定していない）。

### `faq`

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | bigint | PK, generated always as identity | |
| `question` | text | NOT NULL | FAQ の質問文 |
| `answer` | text | NOT NULL | FAQ の回答文 |
| `category` | text | NOT NULL | カテゴリ（例: 営業案内, 料金, 予約） |
| `created_at` | timestamptz | NOT NULL, default now() | |

### `menus`

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | bigint | PK, generated always as identity | |
| `name` | text | NOT NULL | メニュー名 |
| `price` | integer | NOT NULL, check(price >= 0) | 料金（円） |
| `description` | text | NULL 許容 | 説明文 |
| `created_at` | timestamptz | NOT NULL, default now() | |

### `conversations`

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | bigint | PK, generated always as identity | |
| `user_id` | text | NOT NULL | LINE の userId |
| `message` | text | NOT NULL | ユーザーの発言 |
| `bot_response` | text | NOT NULL | Bot の返答テキスト |
| `confidence` | integer | NOT NULL | 確信度（0〜10）|
| `escalated` | boolean | NOT NULL, default false | エスカレーションフラグ |
| `created_at` | timestamptz | NOT NULL, default now() | |

**注**: `confidence` は当初 `text` 型で作成されたが後に `integer` 型に変更。  
`20260819_recreate_conversations_integer_confidence.sql` が DROP/CREATE で対応している。

### `broadcasts`

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | bigint | PK, generated always as identity | |
| `message` | text | NOT NULL | 送信したお知らせ本文 |
| `sent_at` | timestamptz | NOT NULL, default now() | 送信日時 |
| `recipient_count` | integer | NULL 許容 | LINE Insight API から取得した友だち数（取得できない場合 null）|

---

## 6. 主要処理フロー

### 6.1 メッセージ受信〜返信

```
LINE ユーザーがメッセージ送信
    │
    ▼
POST /api/webhook
    │
    ├─[1] x-line-signature 検証
    │      HMAC-SHA256(rawBody, channelSecret) を Base64 化し
    │      timingSafeEqual で比較（タイミング攻撃対策）
    │      → 不一致: 401 を返して終了
    │
    ├─[2] 即座に await processEvents() を呼び出す
    │      ※ fire-and-forget にしてはいけない（後述）
    │
    └─[3] processEvents() の中で:
           │
           ├─ イベントが "message" かつ "text" 型であることを確認
           │
           ├─ Supabase から FAQ 一覧を取得
           │
           ├─ Claude API (askClaude) に FAQ とユーザーメッセージを渡す
           │   └─ システムプロンプト: JSON形式 { answer, confidence } を要求
           │      confidence の判定基準:
           │        8〜10: FAQ に直接該当 → 自動返信
           │        6〜7:  FAQ に関連あり → 要確認だが返信
           │        0〜5:  FAQ に該当なし → エスカレーション
           │
           ├─ confidence >= 6
           │   └─ sendReply(replyToken, answer, accessToken)
           │       LINE Reply API を呼び出す（replyToken は30秒の有効期限）
           │
           └─ confidence <= 5
               ├─ sendReply(replyToken, ESCALATION_REPLY, accessToken)
               │   「担当者に確認して折り返しご連絡いたします」を返信
               ├─ sendPush(OWNER_LINE_USER_ID, 未回答通知, accessToken)
               │   オーナーに Push 通知
               └─ saveConversation({ escalated: true, ... })
                   Supabase に記録
```

### 6.2 管理画面認証フロー

```
ブラウザ → /admin/faq などにアクセス
    │
    ▼
middleware.ts（Edge Runtime で動作）
    ├─ Cookie(admin_token) を取得
    ├─ verifyToken(token, ADMIN_PASSWORD)
    │   generateToken(ADMIN_PASSWORD) と比較
    │   ※ トークンは HMAC-SHA256("admin-session-v1", password) のBase64
    │   ※ パスワードが同じなら常に同じ値（ステートレス）
    ├─ 有効: NextResponse.next() でページを表示
    └─ 無効: /admin にリダイレクト
              │
              ▼
          LoginForm → POST /api/admin/login
              ├─ password === ADMIN_PASSWORD を検証
              ├─ generateToken(ADMIN_PASSWORD) でトークン生成
              └─ admin_token Cookie をセット（httpOnly, 7日）
```

---

## 7. 外部サービス一覧

### LINE Messaging API

| エンドポイント | 役割 |
|---|---|
| `POST /v2/bot/message/reply` | ユーザーへの返信（replyToken 使用、有効期限30秒）|
| `POST /v2/bot/message/push` | オーナーへのエスカレーション通知 |
| `POST /v2/bot/message/broadcast` | 全友だちへのお知らせ一斉送信 |
| `GET /v2/bot/insight/followers?date=YYYYMMDD` | フォロワー数取得（前日付が安定）|

認証: `Authorization: Bearer {LINE_CHANNEL_ACCESS_TOKEN}` ヘッダー

### Anthropic Claude API

- モデル: `claude-haiku-4-5-20251001`（コスト最小・高速）
- `max_tokens: 512`（短い JSON レスポンスのみ返すため十分）
- システムプロンプトで JSON 形式を強制し、`/{[\s\S]*?}/` で抽出
- 確信度は 0〜10 の整数で返させる（3段階ではなく細かな制御のため）

### Supabase

- SDK 不使用。PostgREST の REST API に直接 fetch
- `SUPABASE_SERVICE_ROLE_KEY` で認証（RLS は設定なし）
- Bot 側の `fetchFaqs()` は `id` なしで取得（Claude に不要な情報を渡さないため）
- 管理画面側の `fetchFaqsWithId()` は `id` 込みで取得（CRUD 操作に必要）

### Vercel

- Next.js のホスティング・サーバーレス実行環境
- Webhook endpoint は Node.js Runtime（`export const runtime = "nodejs"`）
- 管理画面の API Route は Middleware（Edge Runtime）+ Node.js Runtime の二層構成

---

## 8. 既知の注意点（遭遇した問題を含む）

### 8.1 `await processEvents()` は省略不可

**問題**: Webhook route で `processEvents()` を `await` せず fire-and-forget にすると、  
Vercel がレスポンス返却後に関数コンテキストを終了させるため、LINE Reply API への fetch が実行されない。  
Vercel のログで `External APIs: No outgoing requests` と表示されて気づいた。

**対策**: `await processEvents(events, accessToken)` を `return new Response(...)` の前に記述する。

```typescript
// NG
processEvents(events, accessToken).catch(console.error);
return new Response("OK", { status: 200 });

// OK
await processEvents(events, accessToken);
return new Response("OK", { status: 200 });
```

### 8.2 管理画面ページには `export const dynamic = "force-dynamic"` が必須

**問題**: Next.js はビルド時に静的ページを事前レンダリングしようとする。  
管理画面ページが Supabase を呼び出すと、ビルド時に環境変数がない状態でリクエストが走り  
`Supabase fetchMenus failed: 404` などのエラーでビルドが失敗する。

**対策**: 全管理画面ページに以下を追加。

```typescript
export const dynamic = "force-dynamic";
```

同時に `unstable_cache` でデータ層を 10 秒キャッシュし、タブ切り替えの体感速度を改善している（ページ自体のプリレンダリングとは別の仕組み）。

### 8.3 Next.js 16 での `revalidateTag` の第2引数

**問題**: Next.js 16 では `revalidateTag(tag)` の署名が変わり、  
第2引数（`profile: string | { expire?: number }`）が必須になった。  
`revalidateTag("faqs")` のみでは TypeScript コンパイルエラーになる。

**対策**:

```typescript
revalidateTag("faqs", { expire: 0 }); // 即時失効
```

### 8.4 管理画面トークンはステートレス（パスワード変更時の注意）

`admin_token` は `HMAC-SHA256("admin-session-v1", ADMIN_PASSWORD)` の Base64。  
パスワードが同じなら常に同じトークン値になる（ランダムな session ID ではない）。

**影響**: `ADMIN_PASSWORD` を変更した場合、既存の Cookie は自動的に無効になる（新しいパスワードで生成されるトークンと一致しないため）。ユーザーに再ログインを求める必要がある。  
逆に、パスワードを変更せずに「セッションを無効化」することはできない。

### 8.5 `lib/line/` ディレクトリと `lib/line.ts` の併存

`lib/line/signature.ts` と `lib/line/types.ts` は Webhook 処理専用モジュール。  
`lib/line.ts` は Reply / Push / Broadcast / Insight の API 関数をまとめたファイル。  
紛らわしいが現状のディレクトリ構成では `lib/line/` と `lib/line.ts` が共存している。

### 8.6 環境変数の Vercel 反映タイミング

Vercel で環境変数を追加・変更しても、**再デプロイするまで本番環境には反映されない**。  
`ADMIN_PASSWORD` の初期設定で詰まりやすい落とし穴。  
変数を追加したら必ず「Redeploy（環境変数の変更を反映）」でデプロイすること。

### 8.7 `.env.local` は `.gitignore` で除外済み

`.gitignore` に `.env*` パターンが含まれる。`.env.example`（空値のテンプレート）は  
`!.env.example` の例外ルールで Git 管理対象にしている。  
秘密情報を誤って commit しないよう注意。

### 8.8 `conversations.confidence` の型変更履歴

テーブル初期作成時に `confidence text` で作成したが、0〜10 の整数スケールに変更する際に  
`integer` に変更した。移行は `DROP TABLE` → `CREATE TABLE` で行っているため  
**以前のデータは失われている**（開発初期のため問題なし）。  
本番稼働後に変更する場合は `ALTER TABLE ... ALTER COLUMN` を使うこと。

---

## 9. ローカル開発手順

```bash
# 1. 依存インストール
npm install

# 2. 環境変数設定
cp .env.example .env.local
# .env.local に各値を記入

# 3. 開発サーバー起動
npm run dev   # http://localhost:3000

# 4. Webhook テスト（LINE と接続せず Claude のみ確認）
node scripts/test-bot.mjs

# 5. Webhook テスト（LINE 署名付き、完全な E2E）
bash scripts/test-webhook.sh

# 6. 型チェック
npx tsc --noEmit
```

### ngrok でローカルを LINE に公開する場合

```bash
ngrok http 3000
# → https://xxxx.ngrok-free.app/api/webhook を LINE Developers Console の Webhook URL に設定
# LINE Console の「検証」ボタンで 200 OK を確認してから実際のメッセージ送信をテスト
```
