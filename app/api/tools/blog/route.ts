import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { BLOG_PROMPT } from '@/prompts/blog'
import { NAIL_NG_RULES, HAIR_NG_RULES, EYE_NG_RULES } from '@/prompts/ng-words'

function getIndustryNG(salonType?: string): string {
  if (!salonType) return ''
  if (salonType.includes('ネイル') || salonType.includes('フット')) return NAIL_NG_RULES
  if (salonType.includes('美容室') || salonType.includes('ヘア')) return HAIR_NG_RULES
  if (salonType.includes('アイ') || salonType.includes('まつ') || salonType.includes('眉')) return EYE_NG_RULES
  return ''
}

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  const { theme, target, appeal, length } = await req.json()
  if (!theme?.trim()) return new Response('テーマを入力してください', { status: 400 })

  // サロンプロフィールを取得
  const { data: profile } = await supabase
    .from('salon_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const profileText = profile ? `
【サロン情報】
サロン名：${profile.salon_name || ''}
業種：${profile.salon_type || ''}
ターゲット：${profile.target_customer || ''}
メニュー：${profile.menu || ''}
こだわり・強み：${profile.commitment || ''}
` : ''

  const lengthGuide = length === 'short' ? '300〜400文字' : length === 'long' ? '800〜1000文字' : '500〜700文字'

  const userMessage = `
${profileText}
【ブログのテーマ・キーワード】
${theme}

【ターゲット（どんな悩みの人向けか）】
${target || '未指定'}

【アピールしたいこと・施術のこだわり】
${appeal || '未指定'}

【文字数の目安】
${lengthGuide}
`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    temperature: 0.7,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: BLOG_PROMPT + getIndustryNG(profile?.salon_type) },
      { role: 'user', content: userMessage },
    ],
  })

  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({
      async start(controller) {
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
