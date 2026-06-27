import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { REVIEW_REPLY_PROMPT } from '@/prompts/review-reply'
import { NAIL_NG_RULES, HAIR_NG_RULES, EYE_NG_RULES, ESTHE_NG_RULES } from '@/prompts/ng-words'

function getIndustryNG(salonType?: string): string {
  if (!salonType) return ''
  if (salonType.includes('ネイル') || salonType.includes('フット')) return NAIL_NG_RULES
  if (salonType.includes('美容室') || salonType.includes('ヘア')) return HAIR_NG_RULES
  if (salonType.includes('アイ') || salonType.includes('まつ') || salonType.includes('眉')) return EYE_NG_RULES
  if (salonType.includes('エステ') || salonType.includes('ダイエット') || salonType.includes('脱毛')) return ESTHE_NG_RULES
  return ''
}

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { review, concern, result, method, salonType } = await req.json()

  if (!review?.trim() || !concern?.trim()) {
    return new Response('口コミと悩みを入力してください', { status: 400 })
  }

  // サロンプロフィールを取得
  const { data: profile } = await supabase
    .from('salon_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const profileText = profile ? `
【サロン情報】
サロン名：${profile.salon_name || '未登録'}
業種：${profile.salon_type || '未登録'}
ターゲット：${profile.target_customer || '未登録'}
こだわり・強み：${profile.commitment || '未登録'}
` : ''

  const userMessage = `
業種：${salonType || profile?.salon_type || '未指定'}
${profileText}
【もらった口コミ】
${review}

【返信に入れる要素】
・お客様の悩み（来店理由）：${concern}
・悩みがどうなったか：${result || '（未入力）'}
・何をしたから改善したか：${method || '（未入力）'}
`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    temperature: 0.7,
    max_tokens: 800,
    messages: [
      { role: 'system', content: REVIEW_REPLY_PROMPT + getIndustryNG(salonType || profile?.salon_type) },
      { role: 'user', content: userMessage },
    ],
  })

  const encoder = new TextEncoder()
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
