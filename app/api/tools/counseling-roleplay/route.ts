import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { ROLEPLAY_CUSTOMER_PROMPT, ROLEPLAY_FEEDBACK_PROMPT } from '@/prompts/counseling-roleplay'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  const { mode, messages, scenario } = await req.json()

  // サロンプロフィールを取得
  const { data: profile } = await supabase
    .from('salon_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const salonInfo = profile
    ? `サロン業種：${profile.salon_type || '未指定'}、ターゲット：${profile.target_customer || '未指定'}`
    : ''

  // フィードバックモード
  if (mode === 'feedback') {
    const conversationText = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? '施術者' : 'お客様'}：${m.content}`
      )
      .join('\n')

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      temperature: 0.5,
      max_tokens: 3000,
      messages: [
        { role: 'system', content: ROLEPLAY_FEEDBACK_PROMPT },
        {
          role: 'user',
          content: `${salonInfo ? `【サロン情報】${salonInfo}\n\n` : ''}【シナリオ】${scenario || '未指定'}\n\n【カウンセリングのやり取り】\n${conversationText}`,
        },
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

  // お客様役モード
  // ※ user=施術者、assistant=お客様 として会話を構成
  const systemPrompt = `${ROLEPLAY_CUSTOMER_PROMPT}\n\n【今回のシナリオ（あなたが演じるお客様の設定）】\n${scenario || '未指定'}\n${salonInfo ? `\n【サロン情報】\n${salonInfo}` : ''}\n\nあなたはこのシナリオのお客様です。施術者（ユーザー）から話しかけられたら、お客様として返答してください。`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    temperature: 0.8,
    max_tokens: 200,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        // user=施術者、assistant=お客様
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
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
