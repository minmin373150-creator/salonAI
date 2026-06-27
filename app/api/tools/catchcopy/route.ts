import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { CATCHCOPY_PROMPT } from '@/prompts/catchcopy'
import { searchKnowledge } from '@/lib/rag/search'
import { NAIL_NG_RULES, HAIR_NG_RULES, EYE_NG_RULES, ESTHE_NG_RULES, SEITAI_NG_RULES, RELAX_NG_RULES, GYM_NG_RULES } from '@/prompts/ng-words'

export const runtime = 'nodejs'
export const maxDuration = 60

function getIndustryNG(salonType?: string): string {
  if (!salonType) return ''
  if (salonType.includes('ネイル') || salonType.includes('フット')) return NAIL_NG_RULES
  if (salonType.includes('美容室') || salonType.includes('ヘア')) return HAIR_NG_RULES
  if (salonType.includes('アイ') || salonType.includes('まつ') || salonType.includes('眉')) return EYE_NG_RULES
  if (salonType.includes('エステ') || salonType.includes('ダイエット') || salonType.includes('脱毛')) return ESTHE_NG_RULES
  if (salonType.includes('整体') || salonType.includes('鍼') || salonType.includes('整骨') || salonType.includes('カイロ')) return SEITAI_NG_RULES
  if (salonType.includes('ヘッドスパ') || salonType.includes('リンパ') || salonType.includes('マッサージ') || salonType.includes('リラク')) return RELAX_NG_RULES
  if (salonType.includes('ヨガ') || salonType.includes('ピラティス') || salonType.includes('ジム') || salonType.includes('パーソナル')) return GYM_NG_RULES
  return ''
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  const { usage, target, menu, appeal } = await req.json()
  if (!target?.trim() && !menu?.trim()) {
    return new Response('ターゲットかメニューを入力してください', { status: 400 })
  }

  const { data: profile } = await supabase
    .from('salon_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const salonType = profile?.salon_type || ''

  // RAGでコピーライティング・キャッチコピー関連の事例を検索
  const ragQuery = `${salonType} キャッチコピー クーポン名 添削 ${target} ${menu}`
  const knowledgeContext = await searchKnowledge(ragQuery)

  const profileText = profile ? `
【サロン情報】
サロン名：${profile.salon_name || ''}
業種：${salonType}
ターゲット：${profile.target_customer || ''}
メニュー：${profile.menu || ''}
こだわり：${profile.commitment || ''}
` : ''

  const usageLabelMap: Record<string, string> = {
    top_catch: 'トップキャッチ（50文字以内）',
    top_copy: 'トップコピー（150文字以内）',
    coupon_name: 'クーポン名（36文字以内）',
    coupon_detail: 'クーポン内容（90文字以内）',
    special_catch: '特集キャッチ（50文字以内）',
    special_copy: '特集コピー（100文字以内）',
  }

  const userMessage = `
${profileText}
【用途】${usageLabelMap[usage] || usage}
【ターゲット・悩み】${target || '未指定'}
【メニュー・施術内容】${menu || '未指定'}
【アピールしたいこと】${appeal || '未指定'}
${knowledgeContext ? `\n【参考にすべき添削事例・ノウハウ】\n${knowledgeContext}` : ''}
`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    temperature: 0.8,
    max_tokens: 1500,
    messages: [
      { role: 'system', content: CATCHCOPY_PROMPT + getIndustryNG(salonType) },
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
