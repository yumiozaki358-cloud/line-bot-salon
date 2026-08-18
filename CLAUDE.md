# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

美容室向け LINE Bot + AI 自動応答システム。LINE Messaging API で受けた問い合わせを Next.js API Route 経由で Claude API に渡し、FAQ・メニュー情報（Supabase）をもとに自動返答する。管理画面とお知らせ一斉配信機能も含む。

```
LINE Messaging API → Webhook → Next.js API Route → Claude API
                                      ↓
                              Supabase（FAQ／メニューDB）
                                      ↓
                              管理画面（Next.js App Router）
```

## コマンド

```bash
npm run dev      # 開発サーバー起動（http://localhost:3000）
npm run build    # プロダクションビルド
npm run start    # プロダクションサーバー起動
npm run lint     # ESLint 実行
```

TypeScript の型チェックのみ実行:
```bash
npx tsc --noEmit
```

## アーキテクチャ

- **フレームワーク**: Next.js 16 App Router（`app/` ディレクトリ）
- **スタイリング**: Tailwind CSS v4（PostCSS プラグイン経由）
- **DB**: Supabase（未実装、予定）
- **AI**: Claude API（未実装、予定）
- **デプロイ**: Vercel

### 主要ディレクトリ構成（予定）

```
app/
  api/
    webhook/        # LINE Messaging API Webhook エンドポイント
    broadcast/      # お知らせ一斉配信 API
  admin/            # 管理画面（FAQ・メニュー編集）
  layout.tsx        # ルートレイアウト
  page.tsx          # トップページ
```

### パスエイリアス

`@/*` → プロジェクトルート（`tsconfig.json` の `paths` 設定）

## 技術的制約

- LINE Webhook は **POST リクエスト**のみ受け付ける。署名検証（`x-line-signature` ヘッダー）が必須。
- Vercel の無料枠を使用するため、関数の実行時間・データ転送量に注意。
- 月額コストを 5,000 円以下に抑える（Claude API 従量課金のみ、他は無料枠）。

## スコープ外（実装しない）

- 予約機能・カレンダー連携
- 顧客カルテ・決済機能
- 多言語対応
