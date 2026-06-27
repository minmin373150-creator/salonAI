# サロンAI セットアップ手順

## ステップ1：Supabaseの設定

### 1-1. プロジェクトのURLとキーを取得
1. [supabase.com](https://supabase.com) にログイン
2. 作成したプロジェクトを開く
3. 左メニュー「Project Settings」→「Data API」を開く
4. 以下をメモする：
   - **Project URL**（例：https://xxxx.supabase.co）
   - **anon public**（公開キー）
   - **service_role**（秘密キー）※絶対に外部に漏らさないこと

### 1-2. データベースを作成
1. 左メニュー「SQL Editor」を開く
2. `supabase/migrations/001_initial_schema.sql` の内容を全コピー
3. SQL Editorに貼り付けて「Run」を押す
4. 次に `supabase/migrations/002_initial_data.sql` も同様に実行する

### 1-3. Storage（ファイル保存場所）を設定
1. 左メニュー「Storage」を開く
2. 「New bucket」をクリック
3. Bucket name: `chat-files`
4. 「Public bucket」は OFF のまま
5. 「Save」をクリック

---

## ステップ2：OpenAI APIキーの取得

1. [platform.openai.com](https://platform.openai.com) にアクセス
2. 「API Keys」→「Create new secret key」
3. 作成されたキーをメモする（一度しか表示されない）

---

## ステップ3：Stripeの設定

1. [stripe.com](https://stripe.com) にログイン
2. 「テストモード」であることを確認（右上のトグル）

### 3-1. 商品・価格を作成
1. 「製品カタログ」→「製品を追加」
2. 名前：`サロンAI月額プラン`
3. 価格：5,500円 / 月次 / 繰り返し
4. 「保存」→ 作成された**Price ID**（price_xxxx）をメモ

### 3-2. APIキーを取得
1. 「開発者」→「APIキー」
2. **公開可能キー**（pk_test_xxxx）をメモ
3. **シークレットキー**（sk_test_xxxx）をメモ

---

## ステップ4：環境変数を設定

`.env.local` ファイルを開いて、以下の通りに値を入力してください：

```
NEXT_PUBLIC_SUPABASE_URL=（Supabase Project URL）
NEXT_PUBLIC_SUPABASE_ANON_KEY=（Supabase anon public）
SUPABASE_SERVICE_ROLE_KEY=（Supabase service_role）

OPENAI_API_KEY=（OpenAI APIキー）

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=（Stripe 公開可能キー）
STRIPE_SECRET_KEY=（Stripe シークレットキー）
STRIPE_WEBHOOK_SECRET=（後で設定 ※今は空欄でOK）
STRIPE_PRICE_ID=（Stripe Price ID）

NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=minmin_150cm@yahoo.co.jp
```

---

## ステップ5：管理者アカウントの設定

1. ブラウザで `http://localhost:3000/register` を開く
2. あなたのメールアドレスで会員登録する
3. Supabase の「Table Editor」→「profiles」テーブルを開く
4. あなたのレコードの `role` を `admin` に変更して保存

---

## ステップ6：開発サーバーの起動

ターミナルで以下を実行：

```bash
cd /Users/minamiyamasaki/Desktop/Cursor/salon-ai
npm run dev
```

ブラウザで `http://localhost:3000` を開いて確認してください。

---

## ステップ7：AIに知識を学習させる

1. 管理者でログイン後 `/admin/knowledge` を開く
2. 「内容」欄に文字起こしデータを貼り付けて追加していく
3. カテゴリは「カウンセリング」「集客」「リピート」などで分類する
4. データが多いほどAIの回答精度が上がる

---

## よくある質問

**Q: Stripeのwebhookはどう設定する？**
A: Vercelにデプロイ後、Stripeダッシュボードの「Webhooks」で
`https://あなたのドメイン/api/stripe/webhook` を登録してください。
その際に表示される「Signing secret」を STRIPE_WEBHOOK_SECRET に設定します。

**Q: 本番公開するには？**
A: Vercel（vercel.com）に無料でデプロイできます。
GitHubにプッシュ → Vercelに接続 → 環境変数を設定 で完了です。
