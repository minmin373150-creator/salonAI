import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export const runtime = 'nodejs'
export const maxDuration = 120

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ja,en;q=0.9',
}

function extractReviews(html: string): string[] {
  const reviews: string[] = []

  // HPBの口コミ本文を抽出（複数パターンで試みる）
  const patterns = [
    // reviewComment クラス
    /class="[^"]*review[Cc]omment[^"]*"[^>]*>([\s\S]*?)<\/p>/g,
    // コメント系クラス
    /class="[^"]*comment[^"]*"[^>]*>([\s\S]*?)<\/p>/g,
    // <p> タグ内の長いテキスト（口コミらしいもの）
    /<p[^>]*>([\s\S]{30,300}?)<\/p>/g,
  ]

  for (const pattern of patterns) {
    let match
    const regex = new RegExp(pattern.source, 'g')
    while ((match = regex.exec(html)) !== null) {
      const text = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (text.length > 20 && !text.includes('ホットペッパー') && !text.includes('©') && !text.includes('Copyright')) {
        reviews.push(text)
      }
    }
    if (reviews.length > 0) break
  }

  return reviews
}

function extractTotalPages(html: string): number {
  const pnMatches = html.match(/PN(\d+)\.html/g)
  if (pnMatches && pnMatches.length > 0) {
    const nums = pnMatches.map(m => parseInt(m.replace('PN', '').replace('.html', '')))
    return Math.max(...nums)
  }
  return 1
}

function buildPageUrl(baseUrl: string, page: number): string {
  const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  if (page === 1) return baseUrl
  return `${url}/PN${page}.html`
}

const REVIEW_ANALYSIS_PROMPT = `あなたは美容サロン専門コンサルタント「山崎みなみ」です。
以下のホットペッパービューティーの口コミを全て読み込んで、サロンオーナーに向けた分析レポートを作成してください。

## 出力形式

### ⭐ このサロンの強み（伸ばすべきポイント）
口コミに繰り返し登場する強みを、具体的なエピソード付きで箇条書き（5〜8項目）

### 🔧 改善・強化できるポイント
不満・要望・もっとよくなりそうな点を、口コミから読み取って提案（3〜5項目）

### 💡 HPBページに活かせるヒント
この口コミ群から読み取れる、キャッチコピーやクーポン文に使えるフレーズ・切り口（3〜5項目）

### 📊 お客様像のまとめ
どんなお客様が多いか、来店動機、リピート理由を一言でまとめる

---
口コミ件数・高評価・低評価のバランスも踏まえて分析してください。
関西弁を少し交えた、みなみらしい温かみのある文体で書いてください。`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  const { reviewUrl } = await req.json()
  if (!reviewUrl?.trim()) {
    return new Response('口コミページのURLを入力してください', { status: 400 })
  }

  // 1ページ目取得
  const firstRes = await fetch(buildPageUrl(reviewUrl, 1), { headers: FETCH_HEADERS })
  if (!firstRes.ok) {
    return new Response('URLが正しくないか、ページが取得できませんでした', { status: 400 })
  }

  const firstHtml = await firstRes.text()
  const totalPages = extractTotalPages(firstHtml)
  const allReviews: string[] = extractReviews(firstHtml)

  // 2ページ目以降
  for (let page = 2; page <= Math.min(totalPages, 10); page++) {
    try {
      const res = await fetch(buildPageUrl(reviewUrl, page), { headers: FETCH_HEADERS })
      if (!res.ok) break
      const html = await res.text()
      allReviews.push(...extractReviews(html))
    } catch {
      break
    }
  }

  if (allReviews.length === 0) {
    return new Response('口コミを取得できませんでした。URLが口コミページか確認してください。', { status: 400 })
  }

  const reviewText = allReviews
    .map((r, i) => `【口コミ${i + 1}】${r}`)
    .join('\n\n')

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    temperature: 0.7,
    max_tokens: 3000,
    messages: [
      { role: 'system', content: REVIEW_ANALYSIS_PROMPT },
      { role: 'user', content: `口コミ総数：${allReviews.length}件（全${totalPages}ページ）\n\n${reviewText}` },
    ],
  })

  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({
      async start(controller) {
        // 取得件数を最初に送信
        controller.enqueue(encoder.encode(`📋 口コミを取得して分析中...\n\n`))
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
