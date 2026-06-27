'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { Announcement } from '@/types'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [form, setForm] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('announcements').insert({
      title: form.title,
      content: form.content,
      is_published: false,
    })
    if (!error) {
      toast.success('下書きとして保存しました')
      setForm({ title: '', content: '' })
      await load()
    }
    setSaving(false)
  }

  async function togglePublish(id: string, current: boolean) {
    const { error } = await supabase
      .from('announcements')
      .update({
        is_published: !current,
        published_at: !current ? new Date().toISOString() : null,
      })
      .eq('id', id)
    if (!error) {
      toast.success(current ? '非公開にしました' : '公開しました')
      await load()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('このお知らせを削除しますか？')) return
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (!error) {
      toast.success('削除しました')
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333] mb-2">お知らせ管理</h1>
      <p className="text-sm text-[#666] mb-8">会員に向けてお知らせを作成・公開できます。</p>

      {/* 作成フォーム */}
      <div className="bg-white rounded-2xl border border-[#EDE8F5] p-6 mb-6">
        <h2 className="font-bold text-[#333] mb-4">新しいお知らせを作成</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="タイトル"
            placeholder="例：新機能のお知らせ"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#333]">内容</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              rows={5}
              required
              placeholder="お知らせの内容を入力してください"
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent"
            />
          </div>
          <Button type="submit" loading={saving} className="self-start">
            <Plus className="w-4 h-4" />
            下書き保存
          </Button>
        </form>
      </div>

      {/* 一覧 */}
      <div className="bg-white rounded-2xl border border-[#EDE8F5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EDE8F5]">
          <h2 className="font-bold text-[#333]">お知らせ一覧</h2>
        </div>
        {announcements.length === 0 ? (
          <p className="text-center text-sm text-[#999] py-12">まだお知らせがありません</p>
        ) : (
          <div className="divide-y divide-[#EDE8F5]">
            {announcements.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-start gap-4 hover:bg-[#FAF7FD]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-[#333]">{a.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      a.is_published ? 'bg-green-100 text-green-700' : 'bg-[#F5F5F5] text-[#999]'
                    }`}>
                      {a.is_published ? '公開中' : '下書き'}
                    </span>
                  </div>
                  <p className="text-xs text-[#999] truncate">{a.content.slice(0, 80)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => togglePublish(a.id, a.is_published)}
                    className="p-2 rounded-lg text-[#ccc] hover:text-[#C9A8E2] hover:bg-[#FAF7FD] transition-colors"
                    title={a.is_published ? '非公開にする' : '公開する'}
                  >
                    {a.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-2 rounded-lg text-[#ccc] hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
