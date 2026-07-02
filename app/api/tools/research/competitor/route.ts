import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export const runtime = 'nodejs'
export const maxDuration = 120

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ja,en;q=0.9',
}

// 業種別SEOキーワード
const SEO_KEYWORDS: Record<string, string[]> = {
  整体: ['腰痛', '首肩こり', '肩こり', '頭痛', '自律神経', '更年期', '骨盤矯正', '猫背', 'ぎっくり腰', '坐骨神経痛', '産後', 'むくみ', '冷え性', '不眠'],
  ネイル: ['ジェルネイル', 'フィルイン', 'パラジェル', '自爪育成', '巻き爪', 'フットケア', 'ネイルケア', 'ハンドケア', 'デザイン', 'ニュアンスネイル', 'オフ', '浮き'],
  美容室: ['カラー', 'トリートメント', 'くせ毛', '縮毛矯正', 'ヘアケア', 'ダメージ', '白髪', 'ハイライト', 'バレイヤージュ', 'ヘッドスパ', 'カット'],
  アイ: ['まつげエクステ', 'マツエク', 'ラッシュリフト', 'パリジェンヌ', '一重', 'ナチュラル', 'ボリューム', '束感', 'まぶた', 'アイブロウ', '眉毛'],
  エステ: ['小顔', 'リフトアップ', 'たるみ', 'シワ', 'シミ', 'ニキビ', '毛穴', '美白', 'フェイシャル', 'ダイエット', '痩身', 'セルライト'],
  脱毛: ['脱毛', '永久脱毛', 'VIO', '産毛', '自己処理', 'ムダ毛', '光脱毛', 'レーザー', 'ツルツル', 'すべすべ'],
  ヘッドスパ: ['頭皮', 'ヘッドスパ', 'リラクゼーション', 'ストレス', '睡眠', '血行', 'リンパ', '頭痛', '肩こり', '癒し'],
  ヨガ: ['ヨガ', 'ピラティス', 'インナーマッスル', '体幹', '柔軟性', 'ダイエット', 'ストレッチ', 'リラックス', '呼吸', '姿勢'],
}

function detectIndustry(text: string): string {
  const counts: Record<string, number> = {}
  for (const [industry, keywords] of Object.entries(SEO_KEYWORDS)) {
    counts[industry] = keywords.filter(k => text.includes(k)).length
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '整体'
}

function countKeywords(text: string, keywords: string[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const kw of keywords) {
    const count = (text.match(new RegExp(kw, 'g')) || []).length
    if (count > 0) result[kw] = count
  }
  return result
}

function extractPageText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractSalonInfo(html: string, url: string): string {
  const text = extractPageText(html)
  // 先頭8000文字に絞る（トークン節約）
  return `【URL】${url}\n${text.substring(0, 8000)}`
}

const COMPETITOR_PROMPT = `あなたは美容サロン専門コンサルタント「山崎みなみ」です。
自社サロンと競合5店舗のホットペッパービューティーページデータをもとに、徹底的な競合リサーチ分析レポートを作成してください。

プロフェッショナルかつ温かみのある文体で書いてください。

## 出力形式

---

## ◆ 基本分析
各店舗の評価・口コミ数・価格帯・メニュー構成を比較表で出力

---

## ◆ SEO分析
※別途キーワードカウントデータを提供します。そのデータを元に解説してください。
どのキーワードで競合が強いか、自社が弱いか、狙えるキーワードは何かを分析。

---

## ◆ ターゲット分析
各店舗が狙っているターゲット層を分析。自社のターゲットと重なっている・いないを整理。

---

## ◆ コピーライティング分析
各店舗のキャッチコピー・トップコピーを比較。反応が取れそうなコピーと弱いコピーを評価。

---

## ◆ クーポン・メニュー分析
価格競争の構図、クーポンの切り口、自社との差異を分析。

---

## ◆ 特集・ブログ分析
どんなテーマで特集・ブログを書いているか。自社が参考にできる切り口。

---

## ◆ 口コミ分析
各店舗の口コミから読み取れる強み・弱み・お客様の声のパターン。

---

## ◆ 信頼分析
資格・実績・数字・専門性の訴求をどれくらいしているか比較。

---

## ◆ 差別化分析
- 競合5店舗で被っている表現・訴求
- 各店舗のUSP（独自の強み）
- 自社の独自性はどこか

---

## ◆ お客様心理分析
- 来店前の不安（競合が潰せていないもの）
- 来店したくなる理由（競合が使っている訴求）
- 安心材料の作り方

---

## ◆ 改善提案
自社が今すぐ直すべきポイントを優先順位付きで提示。

---

## ◆ みなみのサロンAI特別分析

### 🔵 競合が言っていない訴求ポイント
### 🔵 競合が拾えていないお客様の悩み
### 🔵 競合が潰せていない不安・疑問・思い込み
### 🔵 競合との差別化キャッチコピー提案（3案）
### 🔵 競合5店舗の共通点・成功パターン
### 🔵 競合5店舗の弱点・チャンス（ブルーオーシャン）
### 🔵 競合が狙っていないブルーオーシャン戦略

---

## ◆ 比較されたとき、自店が選ばれる理由・選ばれない理由

お客様がホットペッパーで6店舗を見比べているシーンを想定して分析してください。
「なぜ自店が選ばれるのか」「なぜ他店に流れるのか」を具体的に。

---

## ◆ 最優先で直すべき3項目
競合より予約されるために、今週中に直すべきことだけ3つ。

---

## ◆ 競合との勝率
現状のHPBページで競合5店舗と比較したとき、何％の確率で選ばれると思うか。その根拠も。

---

以上を全て出力してください。省略なし。`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  const { ownUrl, competitorUrls } = await req.json()
  if (!ownUrl?.trim() || !competitorUrls?.length) {
    return new Response('自社URLと競合URLを入力してください', { status: 400 })
  }

  const allUrls: string[] = [ownUrl, ...competitorUrls.filter((u: string) => u.trim())]

  // 全ページを並列取得
  const pages = await Promise.all(
    allUrls.map(async (url: string) => {
      try {
        const res = await fetch(url, { headers: FETCH_HEADERS })
        if (!res.ok) return { url, text: `取得失敗: ${url}` }
        const html = await res.text()
        return { url, text: extractSalonInfo(html, url), rawText: extractPageText(html) }
      } catch {
        return { url, text: `取得失敗: ${url}`, rawText: '' }
      }
    })
  )

  // 業種検出（自社ページのテキストから）
  const ownRawText = pages[0]?.rawText || ''
  const industry = detectIndustry(ownRawText)
  const seoKeywords = SEO_KEYWORDS[industry] || SEO_KEYWORDS['整体']

  // SEOキーワードカウント
  const seoResults = pages.map(p => {
    const counts = countKeywords(p.rawText || '', seoKeywords)
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    return { url: p.url, counts, total }
  })

  const seoText = `
【SEOキーワードカウント（業種：${industry}）】
${seoResults.map((r, i) => {
    const label = i === 0 ? '自社' : `競合${i}`
    const keywords = Object.entries(r.counts).map(([k, v]) => `${k}:${v}回`).join('、')
    return `${label}（合計${r.total}個）: ${keywords || 'なし'}`
  }).join('\n')}
`

  const pageTexts = pages.map((p, i) => {
    const label = i === 0 ? '【自社サロン】' : `【競合${i}】`
    return `${label}\n${p.text}`
  }).join('\n\n---\n\n')

  const userMessage = `${seoText}\n\n${pageTexts}`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    temperature: 0.7,
    max_tokens: 6000,
    messages: [
      { role: 'system', content: COMPETITOR_PROMPT },
      { role: 'user', content: userMessage },
    ],
  })

  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`🔍 ${allUrls.length}店舗のページを取得・分析中...\n\n`))
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } }
  )
}
