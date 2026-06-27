'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Store, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const SALON_TYPES = [
  'エステ', '整体・カイロ', 'ネイル', 'アイラッシュ',
  '美容室', 'リラクゼーション', 'ヨガ・ピラティス', 'その他',
]

export default function SalonProfilePage() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    salon_name: '',
    salon_type: '',
    area: '',
    target_customer: '',
    menu: '',
    commitment: '',
  })

  useEffect(() => {
    fetch('/api/salon-profile')
      .then(r => r.json())
      .then(({ profile }) => {
        if (profile) setForm({
          salon_name: profile.salon_name ?? '',
          salon_type: profile.salon_type ?? '',
          area: profile.area ?? '',
          target_customer: profile.target_customer ?? '',
          menu: profile.menu ?? '',
          commitment: profile.commitment ?? '',
        })
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/salon-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      toast.success('サロン情報を保存しました！')
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-[#FAF7FD]">
      <header className="bg-white border-b border-[#EDE8F5] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8D5F5] flex items-center justify-center">
              <Store className="w-4 h-4 text-[#9B6DC3]" />
            </div>
            <h1 className="font-bold text-[#333]">サロン情報の登録</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-[#F4EDFD] rounded-2xl px-5 py-4 mb-6 text-sm text-[#7B4FA0]">
          ここに登録した情報は、カウンセリング添削・口コミ返信などのツールに自動で反映されます。登録しなくても使えますが、登録するとより精度の高い出力になります。
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* サロン名 */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-3 block">サロン名</label>
            <input
              type="text"
              value={form.salon_name}
              onChange={e => update('salon_name', e.target.value)}
              placeholder="例：リラクゼーションサロン ゆめ"
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent"
            />
          </div>

          {/* 業種 */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-3 block">業種</label>
            <div className="flex flex-wrap gap-2">
              {SALON_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => update('salon_type', type)}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                    form.salon_type === type
                      ? 'bg-[#C9A8E2] text-white border-[#C9A8E2]'
                      : 'bg-white text-[#666] border-[#EDE8F5] hover:border-[#C9A8E2]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* エリア */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">エリア・地域</label>
            <p className="text-xs text-[#999] mb-3">例：大阪市北区、東京都渋谷区など</p>
            <input
              type="text"
              value={form.area}
              onChange={e => update('area', e.target.value)}
              placeholder="例：大阪市北区"
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent"
            />
          </div>

          {/* ターゲット */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">ターゲット・理想のお客様像</label>
            <p className="text-xs text-[#999] mb-3">どんなお客様に来てほしいか、具体的に書いてください</p>
            <textarea
              value={form.target_customer}
              onChange={e => update('target_customer', e.target.value)}
              placeholder="例：30〜50代の働く女性。肩こり・腰痛に悩んでいる方。育児と仕事を両立しながら自分の時間を作れていない方。"
              rows={4}
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-y leading-relaxed"
            />
          </div>

          {/* メニュー */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">主なメニュー・料金</label>
            <p className="text-xs text-[#999] mb-3">よく出るメニューや看板メニューを教えてください</p>
            <textarea
              value={form.menu}
              onChange={e => update('menu', e.target.value)}
              placeholder="例：・全身リラクゼーション60分 ¥6,000&#10;・フェイシャル+デコルテ 90分 ¥9,000&#10;・耳つぼ×痩身コース 90分 ¥12,000"
              rows={5}
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-y leading-relaxed"
            />
          </div>

          {/* こだわり */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">サロンのこだわり・強み・他店との違い</label>
            <p className="text-xs text-[#999] mb-3">「うちはここが違う」というポイントを自由に書いてください</p>
            <textarea
              value={form.commitment}
              onChange={e => update('commitment', e.target.value)}
              placeholder="例：・カウンセリングに20分かける（悩みを根本から理解するため）&#10;・完全個室・完全予約制&#10;・施術後のホームケアアドバイスが充実&#10;・お客様の悩みが解決するまで継続サポートする"
              rows={5}
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-y leading-relaxed"
            />
          </div>

          <Button type="submit" loading={loading} size="lg" className="w-full">
            {saved ? (
              <span className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-4 h-4" />
                保存しました！
              </span>
            ) : '保存する'}
          </Button>
        </form>
      </main>
    </div>
  )
}
