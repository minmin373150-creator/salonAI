import { openai } from '@/lib/openai/client'
import { createAdminClient } from '@/lib/supabase/server'

export async function searchKnowledge(query: string): Promise<string> {
  try {
    // クエリをベクトル化
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })

    const embedding = embeddingResponse.data[0].embedding

    // Supabaseでベクトル検索
    const supabase = await createAdminClient()
    const { data: chunks, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.65,
      match_count: 4,
    })

    if (error || !chunks || chunks.length === 0) {
      return ''
    }

    // 検索結果をコンテキスト文字列にまとめる
    const context = chunks
      .map((chunk: { title: string; content: string; category?: string }) =>
        `【${chunk.category ?? '参考情報'}】${chunk.title}\n${chunk.content}`
      )
      .join('\n\n---\n\n')

    return context
  } catch {
    return ''
  }
}
