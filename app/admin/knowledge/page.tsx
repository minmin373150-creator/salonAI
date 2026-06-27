'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { KnowledgeChunk } from '@/types'

export default function KnowledgePage() {
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '' })
  const supabase = createClient()

  useEffect(() => { loadChunks() }, [])

  async function loadChunks() {
    const { data } = await supabase
      .from('knowledge_base')
      .select('id, title, content, category, source_type, source_file, created_at')
      .order('created_at', { ascending: false })
    setChunks(data ?? [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.content) return
    setAdding(true)

    // ベクトル化をAPIに依頼
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      toast.success('知識ベースに追加しました')
      setForm({ title: '', content: '', category: '' })
      await loadChunks()
    } else {
      toast.error('追加に失敗しました')
    }
    setAdding(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('この知識を削除しますか？')) return
    const { error } = await supabase.from('knowledge_base').delete().eq('id', id)
    if (!error) {
      toast.success('削除しました')
      setChunks((prev) => prev.filter((c) => c.id !== id))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333] mb-2">知識ベース管理</h1>
      <p className="text-sm text-[#666] mb-8">
        みなみさんの講座内容・コンサル事例をここに登録することでAIの回答精度が上がります。
      </p>

      {/* 追加フォーム */}
      <div className="bg-white rounded-2xl border border-[#EDE8F5] p-6 mb-6">
        <h2 className="font-bold text-[#333] mb-4">新しい知識を追加</h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Input
            label="タイトル"
            placeholder="例：カウンセリングの基本的な流れ"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <Input
            label="カテゴリ（任意）"
            placeholder="例：カウンセリング、集客、リピート"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#333]">内容</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              placeholder="文字起こしの内容や講座の要点をここに貼り付けてください"
              rows={8}
              required
              className="w-full rounded-xl border border-[#EDE8F5] bg-white px-4 py-3 text-[#333] placeholder-[#aaa] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-y"
            />
          </div>
          <Button type="submit" loading={adding} className="self-start">
            <Plus className="w-4 h-4" />
            追加する
          </Button>
        </form>
      </div>

      {/* 一覧 */}
      <div className="bg-white rounded-2xl border border-[#EDE8F5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EDE8F5] flex items-center justify-between">
          <h2 className="font-bold text-[#333]">登録済みの知識</h2>
          <span className="text-sm text-[#999]">{chunks.length}件</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-[#C9A8E2]" />
          </div>
        ) : chunks.length === 0 ? (
          <p className="text-center text-sm text-[#999] py-12">まだ知識が登録されていません</p>
        ) : (
          <div className="divide-y divide-[#EDE8F5]">
            {chunks.map((chunk) => (
              <div key={chunk.id} className="px-6 py-4 flex items-start gap-4 hover:bg-[#FAF7FD]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-[#333]">{chunk.title}</span>
                    {chunk.category && (
                      <span className="text-xs bg-[#E8D5F5] text-[#9B6DC3] px-2 py-0.5 rounded-full">
                        {chunk.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#999] truncate">{chunk.content.slice(0, 100)}…</p>
                </div>
                <button
                  onClick={() => handleDelete(chunk.id)}
                  className="flex-shrink-0 p-2 rounded-lg text-[#ccc] hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
