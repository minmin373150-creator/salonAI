'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Loader, Copy, Check } from 'lucide-react'
import Button from '@/components/ui/Button'

const LENGTH_OPTIONS = [
  { value: 'short', label: 'ショート', desc: '300〜400文字' },
  { value: 'medium', label: 'スタンダード', desc: '500〜700文字' },
  { value: 'long', label: 'ロング', desc: '800〜1000文字' },
]

export default function BlogPage() {
  const [theme, setTheme] = useState('')
  const [target, setTarget] = useState('')
  const [appeal, setAppeal] = useState('')
  const [length, setLength] = useState('medium')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!theme.trim()) return
    setLoading(true)
    setOutput('')

    try {
      const res = await fetch('/api/tools/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, target, appeal, length }),
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
              <FileText className="w-4 h-4 text-[#9B6DC3]" />
            </div>
            <h1 className="font-bold text-[#333]">ブログ作成</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* テーマ */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              ブログのテーマ・キーワード <span className="text-[#E86A9A]">*</span>
            </label>
            <p className="text-xs text-[#999] mb-3">何について書きたいか、伝えたいことを入力してください</p>
            <textarea
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="例：フィルインネイルのこと / 肩こりが続く本当の原因 / 耳つぼダイエットで食欲が減る理由 / まつ毛パーマのもちを良くするコツ"
              rows={3}
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-none"
            />
          </div>

          {/* ターゲット */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              ターゲット（どんな悩みの人向けか）
            </label>
            <p className="text-xs text-[#999] mb-3">具体的なほど刺さる文頭になります</p>
            <textarea
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="例：ジェルネイルがすぐ浮いてしまう方 / 何度ダイエットしてもリバウンドしてしまう30〜40代女性 / 肩こりで毎日つらい思いをしているデスクワークの方"
              rows={3}
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-none"
            />
          </div>

          {/* アピールポイント */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              アピールしたいこと・施術のこだわり
            </label>
            <p className="text-xs text-[#999] mb-3">他店との違いや、あなたならではのポイントを入れると差別化になります</p>
            <textarea
              value={appeal}
              onChange={e => setAppeal(e.target.value)}
              placeholder="例：甘皮ケアにこだわって根元から整えるので4週間浮かない / カウンセリングで生活習慣まで聞くので根本から改善できる / 化学物質不使用の天然ヘナを使用"
              rows={3}
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-none"
            />
          </div>

          {/* 文字数 */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-3 block">文字数</label>
            <div className="flex gap-3">
              {LENGTH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLength(opt.value)}
                  className={`flex-1 py-3 rounded-xl border text-sm transition-colors ${
                    length === opt.value
                      ? 'bg-[#C9A8E2] text-white border-[#C9A8E2]'
                      : 'bg-white text-[#666] border-[#EDE8F5] hover:border-[#C9A8E2]'
                  }`}
                >
                  <p className="font-bold">{opt.label}</p>
                  <p className={`text-xs mt-0.5 ${length === opt.value ? 'text-white/80' : 'text-[#999]'}`}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!theme.trim()} size="lg">
              {loading ? '作成中...' : 'ブログを作成する'}
            </Button>
          </div>
        </form>

        {/* 出力 */}
        {(output || loading) && (
          <div className="mt-6 bg-white rounded-2xl border border-[#EDE8F5] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#EDE8F5]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A8E2] to-[#F4A7C3] flex items-center justify-center text-white text-xs font-bold">
                  み
                </div>
                <span className="font-bold text-[#333]">作成されたブログ</span>
                {loading && <Loader className="w-4 h-4 text-[#C9A8E2] animate-spin" />}
              </div>
              {output && !loading && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border border-[#EDE8F5] text-[#666] hover:bg-[#FAF7FD] transition-colors"
                >
                  {copied ? (
                    <><Check className="w-4 h-4 text-green-500" /><span className="text-green-500">コピーしました</span></>
                  ) : (
                    <><Copy className="w-4 h-4" /><span>コピー</span></>
                  )}
                </button>
              )}
            </div>

            {output ? (
              <div className="text-sm text-[#333] leading-loose whitespace-pre-wrap">{output}</div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-[#F5F5F5] rounded animate-pulse" style={{ width: `${85 - i * 8}%` }} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
