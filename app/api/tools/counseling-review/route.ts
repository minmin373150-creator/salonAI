import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { COUNSELING_REVIEW_PROMPT } from '@/prompts/counseling-review'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { transcript, salonType } = await req.json()

  if (!transcript?.trim()) {
    return new Response('文字起こしを入力してください', { status: 400 })
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
エリア：${profile.area || '未登録'}
ターゲット：${profile.target_customer || '未登録'}
主なメニュー：${profile.menu || '未登録'}
こだわり・強み：${profile.commitment || '未登録'}
` : ''

  const userMessage = `
業種：${salonType || profile?.salon_type || '未指定'}
${profileText}
【カウンセリング文字起こし】
${transcript}
`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    temperature: 0.5,
    max_tokens: 4000,
    messages: [
      { role: 'system', content: COUNSELING_REVIEW_PROMPT },
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
