import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  const { target } = await req.json()
  if (!target?.trim()) return new Response('ターゲットを入力してください', { status: 400 })

  const { data: profile } = await supabase
    .from('salon_profiles')
    .select('salon_type, menu, commitment')
    .eq('user_id', user.id)
    .single()

  const salonInfo = profile
    ? `業種：${profile.salon_type || '未指定'}、メニュー：${profile.menu || '未指定'}、こだわり：${profile.commitment || '未指定'}`
    : ''

  const prompt = `
あなたは美容サロン専門コンサルタントです。
以下のターゲット顧客が、サロンに来店する前に抱えている「不安・疑問・思い込み・疑い」を洗い出してください。

${salonInfo ? `【サロン情報】\n${salonInfo}\n` : ''}
【ターゲット】
${target}

## 出力ルール
- 不安・疑問・思い込み・疑いのカテゴリに分けて、それぞれ2〜3個ずつ出す
- お客様の言葉で書く（施術者目線NG）
- 具体的に書く（「効果があるか不安」ではなく「本当に1回で変化が出るの？」）
- 各項目は1行で完結させる

## 出力形式（必ずこのフォーマットで）

【不安】
- 〇〇
- 〇〇
- 〇〇

【疑問】
- 〇〇
- 〇〇
- 〇〇

【思い込み】
- 〇〇
- 〇〇

【疑い】
- 〇〇
- 〇〇
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.choices[0].message.content ?? ''
    return Response.json({ ideas: text })
  } catch (e) {
    console.error('Blog ideas error:', e)
    return new Response('AIの呼び出しに失敗しました', { status: 500 })
  }
}
