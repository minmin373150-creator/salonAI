'use client'

import { useState } from 'react'
import { saveHistory } from '@/lib/saveHistory'
import Link from 'next/link'
import { ArrowLeft, Star, Loader, Copy, Check } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function ReviewAnalysisPage() {
  const [reviewUrl, setReviewUrl] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewUrl.trim()) return
    setLoading(true)
    setOutput('')
    setError('')

    try {
      const res = await fetch('/api/tools/research/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewUrl }),
      })

      if (!res.ok) {
        const text = await res.text()
        setError(text || 'エラーが発生しました')
        return
      }

      const reader = res.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setOutput(text)
      }
      await saveHistory('口コミ分析', reviewUrl, text)
    } catch {
      setError('通信エラーが発生しました。もう一度お試しください。')
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
          <Link href="/tools/research" className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3CD] flex items-center justify-center">
              <Star className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <h1 className="font-bold text-[#333]">口コミ分析</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              HPBの口コミページURL
            </label>
            <p className="text-xs text-[#999] mb-3">
              ホットペッパーの口コミページURLを貼ってください。全ページの口コミを自動取得して分析します。
            </p>
            <input
              type="text"
              value={reviewUrl}
              onChange={e => setReviewUrl(e.target.value)}
              placeholder="例：https://beauty.hotpepper.jp/kr/slnH000000000/review/"
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
            />
            <div className="mt-3 bg-[#FFFBEB] rounded-xl p-3">
              <p className="text-xs text-[#666] font-bold mb-1">📌 URLの見つけ方</p>
              <p className="text-xs text-[#888] leading-relaxed">
                HPBで自分のサロンページを開く → 「口コミ」タブをクリック → そのページのURLをコピー
              </p>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={!reviewUrl.trim()}
            size="lg"
            className="w-full"
            style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B' }}
          >
            {loading ? '口コミを取得・分析中...' : '口コミを全件分析する'}
          </Button>

          {loading && (
            <div className="flex items-center gap-2 justify-center text-sm text-[#F59E0B]">
              <Loader className="w-4 h-4 animate-spin" />
              <span>全ページの口コミを取得してAIが分析しています…</span>
            </div>
          )}
        </form>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {(output || loading) && (
          <div className="mt-6 bg-white rounded-2xl border border-[#EDE8F5] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#EDE8F5]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A8E2] to-[#F4A7C3] flex items-center justify-center text-white text-xs font-bold">
                  み
                </div>
                <span className="font-bold text-[#333]">口コミ分析レポート</span>
                {loading && <Loader className="w-4 h-4 text-[#F59E0B] animate-spin" />}
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
              <div className="prose prose-sm max-w-none">
                {output.split('\n').map((line, i) => {
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-base font-bold text-[#333] mt-5 mb-2">{line.replace('### ', '')}</h3>
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-lg font-bold text-[#333] mt-6 mb-3">{line.replace('## ', '')}</h2>
                  }
                  if (line.startsWith('- ') || line.startsWith('・')) {
                    return <p key={i} className="text-sm text-[#444] leading-relaxed pl-3 border-l-2 border-[#EDE8F5] my-1.5">{line}</p>
                  }
                  if (line.trim() === '') return <div key={i} className="h-2" />
                  return <p key={i} className="text-sm text-[#444] leading-relaxed">{line}</p>
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`h-4 bg-[#F5F5F5] rounded-full animate-pulse`} style={{ width: `${70 + (i % 3) * 10}%` }} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
