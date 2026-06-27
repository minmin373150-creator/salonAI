import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { searchKnowledge } from '@/lib/rag/search'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // 認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // サブスク確認（開発中は一時的にスキップ）
  // TODO: 本番公開前に有効化する（サブスクチェック）

  const { messages, sessionId } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    return new Response('Bad Request', { status: 400 })
  }

  const userMessage = messages[messages.length - 1]?.content ?? ''

  // アクティブなシステムプロンプトを取得
  const { data: promptData } = await supabase
    .from('system_prompts')
    .select('prompt_text')
    .eq('is_active', true)
    .single()

  // RAG: みなみさんの知識を検索
  const knowledgeContext = await searchKnowledge(userMessage)

  const systemPrompt = [
    promptData?.prompt_text ?? '',
    knowledgeContext
      ? `\n\n## 参考にすべき過去のコンサル事例・知識\n\n${knowledgeContext}`
      : '',
  ].join('')

  // OpenAI ストリーミング
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    temperature: 0.7,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10), // 直近10件のみ渡してコスト削減
    ],
  })

  // ストリームをそのままクライアントへ転送しつつ、完了時にDBに保存
  const encoder = new TextEncoder()
  let fullResponse = ''

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) {
          fullResponse += text
          controller.enqueue(encoder.encode(text))
        }
      }
      controller.close()

      // チャットをDBに保存
      if (sessionId && fullResponse) {
        await supabase.from('chat_messages').insert([
          { session_id: sessionId, role: 'user', content: userMessage },
          { session_id: sessionId, role: 'assistant', content: fullResponse },
        ])

        // セッションのタイトルが「新しい相談」のままなら自動生成
        const { data: session } = await supabase
          .from('chat_sessions')
          .select('title')
          .eq('id', sessionId)
          .single()

        if (session?.title === '新しい相談') {
          const title = userMessage.slice(0, 30) + (userMessage.length > 30 ? '…' : '')
          await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('id', sessionId)
        }
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
