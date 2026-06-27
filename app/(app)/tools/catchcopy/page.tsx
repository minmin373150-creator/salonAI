'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Type, Loader, Copy, Check } from 'lucide-react'
import Button from '@/components/ui/Button'

const USAGE_OPTIONS = [
  { value: 'top_catch', label: 'トップキャッチ', desc: '50文字以内', limit: 50 },
  { value: 'top_copy', label: 'トップコピー', desc: '150文字以内', limit: 150 },
  { value: 'coupon_name', label: 'クーポン名', desc: '36文字以内', limit: 36 },
  { value: 'coupon_detail', label: 'クーポン内容', desc: '90文字以内', limit: 90 },
  { value: 'special_catch', label: '特集キャッチ', desc: '50文字以内', limit: 50 },
  { value: 'special_copy', label: '特集コピー', desc: '100文字以内', limit: 100 },
]

export default function CatchcopyPage() {
  const [usage, setUsage] = useState('coupon')
  const [target, setTarget] = useState('')
  const [menu, setMenu] = useState('')
  const [appeal, setAppeal] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!target.trim() && !menu.trim()) return
    setLoading(true)
    setOutput('')

    try {
      const res = await fetch('/api/tools/catchcopy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usage, target, menu, appeal }),
      })
      if (!res.ok) throw new Error()
      const reader = res.body?.getReader()
      if (!reader) throw new Error()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setOutput(text)
      }
    } catch {
      setOutput('エラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#FAF7FD]">
      <header className="bg-white border-b border-[#EDE8F5] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8D5F5] flex items-center justify-center">
              <Type className="w-4 h-4 text-[#9B6DC3]" />
            </div>
            <h1 className="font-bold text-[#333]">キャッチコピー作成</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* 用途 */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              ホットペッパーのどこに使いますか？
            </label>
            <p className="text-xs text-[#999] mb-3">文字数制限に合わせて最適なコピーを作ります</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {USAGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUsage(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    usage === opt.value
                      ? 'bg-[#C9A8E2] text-white border-[#C9A8E2]'
                      : 'bg-white text-[#666] border-[#EDE8F5] hover:border-[#C9A8E2]'
                  }`}
                >
                  <p className="font-bold text-sm">{opt.label}</p>
                  <p className={`text-xs mt-0.5 ${usage === opt.value ? 'text-white/80' : 'text-[#999]'}`}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ターゲット */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              ターゲット・お客様の悩み
            </label>
            <p className="text-xs text-[#999] mb-3">「私のことだ！」と思わせる悩みを具体的に</p>
            <textarea
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="例：ジェルがすぐ浮いてしまう30代女性&#10;毎日デスクワークで肩こりがひどい方&#10;何度ダイエットしてもリバウンドしてしまう40代女性"
              rows={3}
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-none"
            />
          </div>

          {/* メニュー */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              メニュー・施術内容
            </label>
            <p className="text-xs text-[#999] mb-3">何のコピーを作りたいか</p>
            <textarea
              value={menu}
              onChange={e => setMenu(e.target.value)}
              placeholder="例：フィルイン×ジェルネイル&#10;骨盤矯正コース&#10;耳つぼダイエット体験コース"
              rows={2}
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-none"
            />
          </div>

          {/* アピールポイント */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              アピールしたいこと・他店との違い（任意）
            </label>
            <textarea
              value={appeal}
              onChange={e => setAppeal(e.target.value)}
              placeholder="例：甘皮ケアにこだわって4週間浮かない / カウンセリングで生活習慣まで聞くので根本から変わる"
              rows={2}
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-none"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={!target.trim() && !menu.trim()}
            size="lg"
            className="w-full"
          >
            {loading ? '作成中...' : 'キャッチコピーを10個作る'}
          </Button>
        </form>

        {/* 出力 */}
        {(output || loading) && (
          <div className="mt-6 bg-white rounded-2xl border border-[#EDE8F5] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#EDE8F5]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A8E2] to-[#F4A7C3] flex items-center justify-center text-white text-xs font-bold">
                  み
                </div>
                <span className="font-bold text-[#333]">キャッチコピー案</span>
                {loading && <Loader className="w-4 h-4 text-[#C9A8E2] animate-spin" />}
              </div>
              {output && !loading && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border border-[#EDE8F5] text-[#666] hover:bg-[#FAF7FD] transition-colors"
                >
                  {copied
                    ? <><Check className="w-4 h-4 text-green-500" /><span className="text-green-500">コピーしました</span></>
                    : <><Copy className="w-4 h-4" /><span>全てコピー</span></>
                  }
                </button>
              )}
            </div>

            {output ? (
              <div className="flex flex-col gap-3">
                {output.split('\n').map((line, i) => {
                  // 番号付きコピー行（① 「〜」）
                  const copyMatch = line.match(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*「(.+)」/)
                  if (copyMatch) {
                    return (
                      <div key={i} className="bg-[#FAF7FD] rounded-xl p-4 border border-[#EDE8F5]">
                        <p className="font-bold text-[#333] text-sm leading-relaxed">「{copyMatch[1]}」</p>
                      </div>
                    )
                  }
                  // → の解説行
                  if (line.startsWith('→')) {
                    return (
                      <p key={i} className="text-xs text-[#999] px-1 mb-2 leading-relaxed">{line}</p>
                    )
                  }
                  if (line.trim() === '') return <div key={i} className="h-1" />
                  return <p key={i} className="text-sm text-[#444] leading-relaxed">{line}</p>
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-[#F5F5F5] rounded-xl animate-pulse" />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
