'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Stethoscope, FileText, Star, MessageSquare, BarChart2, ChevronDown, ChevronUp } from 'lucide-react'

type HistoryItem = {
  id: string
  tool_name: string
  input_summary: string
  output: string
  created_at: string
}

const TOOL_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'カウンセリング添削': { icon: Stethoscope, color: '#9B6DC3', bg: '#E8D5F5' },
  'ブログ作成': { icon: FileText, color: '#9B6DC3', bg: '#E8D5F5' },
  '口コミ返信作成': { icon: Star, color: '#9B6DC3', bg: '#E8D5F5' },
  'カウンセリングロールプレイ': { icon: MessageSquare, color: '#9B6DC3', bg: '#E8D5F5' },
  '口コミ分析': { icon: Star, color: '#F59E0B', bg: '#FEF3CD' },
  '競合リサーチ分析': { icon: BarChart2, color: '#9B6DC3', bg: '#E8D5F5' },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(({ history }) => setHistory(history || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#FAF7FD]">
      <header className="bg-white border-b border-[#EDE8F5] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8D5F5] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#9B6DC3]" />
            </div>
            <h1 className="font-bold text-[#333]">履歴</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-[#EDE8F5] animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-10 text-center">
            <Clock className="w-10 h-10 text-[#ccc] mx-auto mb-3" />
            <p className="text-sm text-[#999]">まだ履歴がありません</p>
            <p className="text-xs text-[#bbb] mt-1">ツールを使うと、ここに履歴が表示されます</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(item => {
              const toolInfo = TOOL_ICONS[item.tool_name] || { icon: Clock, color: '#9B6DC3', bg: '#E8D5F5' }
              const Icon = toolInfo.icon
              const isOpen = expanded === item.id

              return (
                <div key={item.id} className="bg-white rounded-2xl border border-[#EDE8F5] overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-[#FAF7FD] transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: toolInfo.bg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: toolInfo.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-[#9B6DC3]">{item.tool_name}</span>
                        <span className="text-xs text-[#bbb]">{formatDate(item.created_at)}</span>
                      </div>
                      <p className="text-sm text-[#444] truncate">{item.input_summary}</p>
                    </div>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-[#bbb] flex-shrink-0 mt-1" />
                      : <ChevronDown className="w-4 h-4 text-[#bbb] flex-shrink-0 mt-1" />
                    }
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#EDE8F5] px-4 py-4 bg-[#FAF7FD]">
                      <p className="text-xs font-bold text-[#999] mb-2">回答</p>
                      <div className="text-sm text-[#444] leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                        {item.output}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
