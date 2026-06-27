'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import type { SystemPrompt } from '@/types'

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([])
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadPrompts() }, [])

  async function loadPrompts() {
    const { data } = await supabase
      .from('system_prompts')
      .select('*')
      .order('version', { ascending: false })
    setPrompts(data ?? [])
    const active = data?.find((p) => p.is_active)
    if (active) setEditText(active.prompt_text)
  }

  async function handleSave() {
    if (!editText.trim()) return
    setSaving(true)

    const maxVersion = Math.max(0, ...prompts.map((p) => p.version))

    // 全プロンプトを非アクティブに
    await supabase.from('system_prompts').update({ is_active: false }).neq('id', '')

    // 新バージョンを挿入
    const { error } = await supabase.from('system_prompts').insert({
      version: maxVersion + 1,
      prompt_text: editText,
      is_active: true,
    })

    if (error) {
      toast.error('保存に失敗しました')
    } else {
      toast.success(`バージョン${maxVersion + 1}として保存しました`)
      await loadPrompts()
    }
    setSaving(false)
  }

  async function handleActivate(id: string) {
    await supabase.from('system_prompts').update({ is_active: false }).neq('id', '')
    await supabase.from('system_prompts').update({ is_active: true }).eq('id', id)
    toast.success('アクティブなプロンプトを変更しました')
    await loadPrompts()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333] mb-2">AIプロンプト管理</h1>
      <p className="text-sm text-[#666] mb-8">
        AIへの指示文（プロンプト）を管理します。変更するたびに新バージョンとして保存されます。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 編集エリア */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EDE8F5] p-6">
          <h2 className="font-bold text-[#333] mb-4">プロンプトを編集</h2>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={20}
            className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-y"
          />
          <div className="flex justify-end mt-4">
            <Button onClick={handleSave} loading={saving}>
              新バージョンとして保存
            </Button>
          </div>
        </div>

        {/* バージョン履歴 */}
        <div className="bg-white rounded-2xl border border-[#EDE8F5] p-6">
          <h2 className="font-bold text-[#333] mb-4">バージョン履歴</h2>
          <div className="flex flex-col gap-2">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`p-3 rounded-xl border text-sm ${
                  prompt.is_active
                    ? 'border-[#C9A8E2] bg-[#FAF7FD]'
                    : 'border-[#EDE8F5]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[#333]">v{prompt.version}</span>
                  {prompt.is_active && (
                    <span className="text-xs bg-[#C9A8E2] text-white px-2 py-0.5 rounded-full">
                      使用中
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#999] mb-2">
                  {new Date(prompt.created_at).toLocaleDateString('ja-JP')}
                </p>
                {!prompt.is_active && (
                  <button
                    onClick={() => {
                      setEditText(prompt.prompt_text)
                      handleActivate(prompt.id)
                    }}
                    className="text-xs text-[#C9A8E2] hover:underline"
                  >
                    このバージョンに戻す
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
