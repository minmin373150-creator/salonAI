'use client'

import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2 } from 'lucide-react'

type Admin = { id: string; email: string; created_at: string }

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch('/api/admin/admins')
    const { admins } = await res.json()
    setAdmins(admins || [])
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error)
    else { setEmail(''); load() }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('この管理者を削除しますか？')) return
    await fetch('/api/admin/admins', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333] mb-6">管理者一覧</h1>

      {/* 追加フォーム */}
      <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5 mb-6">
        <p className="text-sm font-bold text-[#333] mb-3">管理者を追加</p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="メールアドレス（先にサインアップが必要）"
            className="flex-1 rounded-xl border border-[#EDE8F5] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A8E2]"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="flex items-center gap-1.5 bg-[#C9A8E2] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />追加
          </button>
        </form>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      {/* 一覧 */}
      <div className="bg-white rounded-2xl border border-[#EDE8F5] overflow-hidden">
        {admins.length === 0 ? (
          <p className="text-center text-[#999] text-sm py-8">管理者がいません</p>
        ) : (
          admins.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-4 border-b border-[#EDE8F5] last:border-0">
              <div className="w-8 h-8 rounded-full bg-[#E8D5F5] flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-[#9B6DC3]" />
              </div>
              <span className="flex-1 text-sm text-[#333]">{a.email}</span>
              <span className="text-xs text-[#bbb]">
                {new Date(a.created_at).toLocaleDateString('ja-JP')}
              </span>
              <button onClick={() => handleDelete(a.id)} className="p-1.5 text-[#ccc] hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
