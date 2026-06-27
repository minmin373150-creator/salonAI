import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export async function POST(req: NextRequest) {
  // 管理者チェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, content, category } = await req.json()

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  // OpenAIでテキストをベクトル化
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: `${title}\n\n${content}`,
  })

  const embedding = embeddingResponse.data[0].embedding

  // 管理者クライアントでDB挿入（RLSを通過するため）
  const adminSupabase = await createAdminClient()
  const { error } = await adminSupabase.from('knowledge_base').insert({
    title,
    content,
    category: category || null,
    source_type: 'text',
    embedding,
  })

  if (error) {
    console.error('Knowledge insert error:', error)
    return NextResponse.json({ error: 'Failed to insert' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
