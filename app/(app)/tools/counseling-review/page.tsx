'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Stethoscope, Loader } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import Button from '@/components/ui/Button'

const markdownComponents: Components = {
  h3({ children }) {
    return (
      <div className="flex items-center gap-2 mt-8 mb-4 pb-3 border-b-2 border-[#EDE8F5]">
        <span className="text-base font-bold text-[#333]">{children}</span>
      </div>
    )
  },
  h4({ children }) {
    return <h4 className="font-bold text-[#555] mt-4 mb-2 text-sm">{children}</h4>
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-4 rounded-xl border border-[#EDE8F5]">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    )
  },
  thead({ children }) {
    return <thead className="bg-[#C9A8E2] text-white">{children}</thead>
  },
  th({ children }) {
    return <th className="px-4 py-3 text-left font-semibold text-sm">{children}</th>
  },
  td({ children }) {
    return <td className="px-4 py-3 border-t border-[#EDE8F5] text-[#444]">{children}</td>
  },
  tr({ children }) {
    return <tr className="hover:bg-[#FAF7FD] transition-colors">{children}</tr>
  },
  blockquote({ children }) {
    return (
      <div className="border-l-4 border-[#C9A8E2] bg-[#FAF7FD] rounded-r-xl px-5 py-4 my-4 text-[#555]">
        {children}
      </div>
    )
  },
  strong({ children }) {
    const text = String(children)
    // ★評価はバッジ風に
    if (/^★+☆*$/.test(text)) {
      return <span className="inline-block bg-[#F4A7C3] text-white text-xs px-2 py-0.5 rounded-full font-bold">{text}</span>
    }
    return <strong className="text-[#9B6DC3] font-bold">{children}</strong>
  },
  ul({ children }) {
    return <ul className="my-3 space-y-1.5 pl-1">{children}</ul>
  },
  li({ children }) {
    return (
      <li className="flex gap-2 text-[#444] leading-relaxed">
        <span className="text-[#C9A8E2] mt-1 flex-shrink-0">•</span>
        <span>{children}</span>
      </li>
    )
  },
  hr() {
    return <hr className="my-6 border-[#EDE8F5]" />
  },
  p({ children }) {
    return <p className="my-2 leading-relaxed text-[#444]">{children}</p>
  },
}

const SALON_TYPES = [
  'エステ', '整体・カイロ', 'ネイル', 'アイラッシュ',
  '美容室', 'リラクゼーション', 'その他',
]

export default function CounselingReviewPage() {
  const [transcript, setTranscript] = useState('')
  const [salonType, setSalonType] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!transcript.trim()) return

    setLoading(true)
    setResult('')

    try {
      const res = await fetch('/api/tools/counseling-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, salonType }),
      })

      if (!res.ok) throw new Error('分析に失敗しました')

      const reader = res.body?.getReader()
      if (!reader) throw new Error()

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setResult(accumulated)
      }
    } catch {
      setResult('エラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7FD]">
      {/* ヘッダー */}
      <header className="bg-white border-b border-[#EDE8F5] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/chat"
            className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8D5F5] flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-[#9B6DC3]" />
            </div>
            <h1 className="font-bold text-[#333]">カウンセリング添削</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 入力フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#EDE8F5] p-6 mb-6">
          <h2 className="font-bold text-[#333] mb-1">カウンセリングの文字起こしを貼り付けてください</h2>
          <p className="text-sm text-[#999] mb-4">
            録音・動画の文字起こしをそのまま貼り付けでOKです。
          </p>

          {/* 業種選択 */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[#333] mb-2 block">業種</label>
            <div className="flex flex-wrap gap-2">
              {SALON_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSalonType(type)}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                    salonType === type
                      ? 'bg-[#C9A8E2] text-white border-[#C9A8E2]'
                      : 'bg-white text-[#666] border-[#EDE8F5] hover:border-[#C9A8E2]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* テキストエリア */}
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={`例：\n施術者：こんにちは！今日はどんなお悩みで来られましたか？\nお客様：最近、フェイスラインがたるんできた気がして...\n施術者：そうなんですね。いつ頃から気になり始めましたか？\n...`}
            rows={12}
            className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-y leading-relaxed"
          />

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-[#bbb]">
              {transcript.length}文字
            </p>
            <Button
              type="submit"
              loading={loading}
              disabled={!transcript.trim()}
              size="lg"
            >
              {loading ? '分析中...' : '添削してもらう'}
            </Button>
          </div>
        </form>

        {/* 結果表示 */}
        {(result || loading) && (
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#EDE8F5]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A8E2] to-[#F4A7C3] flex items-center justify-center text-white text-xs font-bold">
                み
              </div>
              <span className="font-bold text-[#333]">みなみからのフィードバック</span>
              {loading && (
                <Loader className="w-4 h-4 text-[#C9A8E2] animate-spin ml-auto" />
              )}
            </div>

            {result ? (
              <div className="max-w-none text-[#333] text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {result}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-[#F5F5F5] rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
