import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

function extractSalonNames(html: string): string[] {
  const names: string[] = []
  // HPBのサロン名は <h3> 内の <a> タグに入っている
  const regex = /<h3[^>]*>\s*<a[^>]*href="\/[^"]*\/[^"]+\/[^"]*"[^>]*>([^<]+)<\/a>/g
  let match
  while ((match = regex.exec(html)) !== null) {
    const name = match[1].trim()
    if (name && name.length > 1 && !name.includes('ホットペッパー')) {
      names.push(name)
    }
  }
  return names
}

function extractTotalPages(html: string): number {
  // 「全XX件」「13ページ」などのパターンを検索
  const pageMatch = html.match(/(\d+)<\/a>\s*<\/li>\s*<\/ul>\s*<\/div>/)
  if (pageMatch) return parseInt(pageMatch[1])

  // PN○○.html のリンクから最大ページ数を取得
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

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { areaUrl, salonName } = await req.json()
  if (!areaUrl?.trim() || !salonName?.trim()) {
    return Response.json({ error: 'エリアURLとサロン名を入力してください' }, { status: 400 })
  }

  try {
    // 1ページ目を取得してページ数を把握
    const firstRes = await fetch(buildPageUrl(areaUrl, 1), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      },
    })

    if (!firstRes.ok) {
      return Response.json({ error: 'URLが正しくないか、ページが取得できませんでした' }, { status: 400 })
    }

    const firstHtml = await firstRes.text()
    const totalPages = extractTotalPages(firstHtml)

    // 全ページを順番に検索
    for (let page = 1; page <= totalPages; page++) {
      let html = page === 1 ? firstHtml : null

      if (!html) {
        const res = await fetch(buildPageUrl(areaUrl, page), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ja,en;q=0.9',
          },
        })
        if (!res.ok) break
        html = await res.text()
      }

      // サロン名が含まれているかチェック（部分一致）
      if (!html.includes(salonName)) continue

      const names = extractSalonNames(html)
      const indexInPage = names.findIndex(n => n.includes(salonName) || salonName.includes(n.substring(0, 10)))

      if (indexInPage !== -1) {
        const positionInPage = indexInPage + 1
        const overallPosition = (page - 1) * 20 + positionInPage
        return Response.json({
          found: true,
          page,
          totalPages,
          positionInPage,
          overallPosition,
          salonNameFound: names[indexInPage],
          nearbyNames: names.slice(Math.max(0, indexInPage - 2), indexInPage + 3),
        })
      }
    }

    // 見つからなかった場合
    return Response.json({
      found: false,
      totalPages,
      message: `${totalPages}ページ（全${totalPages * 20}件前後）を検索しましたが、「${salonName}」は見つかりませんでした。サロン名の表記を確認してください。`,
    })

  } catch (e) {
    console.error(e)
    return Response.json({ error: 'ページの取得に失敗しました' }, { status: 500 })
  }
}
