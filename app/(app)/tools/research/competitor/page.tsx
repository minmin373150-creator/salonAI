'use client'

import { useState } from 'react'
import { saveHistory } from '@/lib/saveHistory'
import HistoryTab from '@/components/ui/HistoryTab'
import Link from 'next/link'
import { ArrowLeft, Users, Loader, Copy, Check, Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function CompetitorResearchPage() {
  const [tab, setTab] = useState<'create' | 'history'>('create')
  const [ownUrl, setOwnUrl] = useState('')
  const [competitorUrls, setCompetitorUrls] = useState(['', '', '', '', ''])
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  function updateCompetitor(index: number, value: string) {
    const updated = [...competitorUrls]
    updated[index] = value
    setCompetitorUrls(updated)
  }

  const filledCompetitors = competitorUrls.filter(u => u.trim())
  const canSubmit = ownUrl.trim() && filledCompetitors.length >= 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setOutput('')
    setError('')

    try {
      const res = await fetch('/api/tools/research/competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownUrl, competitorUrls: filledCompetitors }),
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
      await saveHistory('競合リサーチ分析', `自社:${ownUrl.substring(0, 50)}`, text)
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
            <div className="w-8 h-8 rounded-xl bg-[#E8D5F5] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#9B6DC3]" />
            </div>
            <h1 className="font-bold text-[#333]">競合リサーチ分析</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          {(['create', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${tab === t ? 'bg-[#C9A8E2] text-white' : 'bg-white text-[#999] border border-[#EDE8F5]'}`}>
              {t === 'create' ? '作成' : '履歴'}
            </button>
          ))}
        </div>
        {tab === 'history' && <HistoryTab toolName="競合リサーチ分析" />}
        {tab === 'create' && <>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* 自社URL */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              自社のホットペッパーURL
            </label>
            <p className="text-xs text-[#999] mb-3">自分のサロンのHPBページURL</p>
            <input
              type="text"
              value={ownUrl}
              onChange={e => setOwnUrl(e.target.value)}
              placeholder="例：https://beauty.hotpepper.jp/kr/slnH000000000/"
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#9B6DC3] focus:border-transparent"
            />
          </div>

          {/* 競合URL */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              競合サロンのURL（最大5店舗）
            </label>
            <p className="text-xs text-[#999] mb-3">リボンデータなどで調べた競合のHPBページURLを貼ってください</p>
            <div className="flex flex-col gap-2">
              {competitorUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#9B6DC3] w-12 flex-shrink-0">競合{i + 1}</span>
                  <input
                    type="text"
                    value={url}
                    onChange={e => updateCompetitor(i, e.target.value)}
                    placeholder="https://beauty.hotpepper.jp/..."
                    className="flex-1 rounded-xl border border-[#EDE8F5] px-4 py-2.5 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#9B6DC3] focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FEF3FF] rounded-2xl border border-[#E8D5F5] p-4">
            <p className="text-xs text-[#666] leading-relaxed">
              💡 <span className="font-bold">分析にかかる時間：1〜2分</span>ほどです。6店舗のページを全て取得してから分析するため、少しお待ちください。
            </p>
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={!canSubmit}
            size="lg"
            className="w-full"
          >
            {loading ? '分析中...' : `自社＋競合${filledCompetitors.length}店舗を分析する`}
          </Button>

          {loading && (
            <div className="flex items-center gap-2 justify-center text-sm text-[#9B6DC3]">
              <Loader className="w-4 h-4 animate-spin" />
              <span>ページを取得してAIが分析しています（1〜2分）…</span>
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
                <span className="font-bold text-[#333]">競合リサーチ分析レポート</span>
                {loading && <Loader className="w-4 h-4 text-[#9B6DC3] animate-spin" />}
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
              <div className="flex flex-col gap-1">
                {output.split('\n').map((line, i) => {
                  if (line.startsWith('## ◆')) {
                    return <h2 key={i} className="text-base font-bold text-[#9B6DC3] mt-6 mb-2 pt-4 border-t border-[#EDE8F5] first:border-0 first:pt-0">{line.replace('## ', '')}</h2>
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-sm font-bold text-[#333] mt-3 mb-1">{line.replace('### ', '')}</h3>
                  }
                  if (line.startsWith('- ') || line.startsWith('・')) {
                    return <p key={i} className="text-sm text-[#444] leading-relaxed pl-3 border-l-2 border-[#EDE8F5] my-1">{line}</p>
                  }
                  if (line.startsWith('---')) {
                    return <div key={i} className="h-px bg-[#EDE8F5] my-3" />
                  }
                  if (line.trim() === '') return <div key={i} className="h-1" />
                  return <p key={i} className="text-sm text-[#444] leading-relaxed">{line}</p>
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-[#F5F5F5] rounded-full animate-pulse" style={{ width: `${60 + (i % 4) * 10}%` }} />
                ))}
              </div>
            )}
          </div>
        )}
      </>}
      </main>
    </div>
  )
}
