'use client'

import { useState, useEffect } from 'react'
import { Clock, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

type HistoryItem = {
  id: string
  tool_name: string
  input_summary: string
  output: string
  created_at: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function HistoryTab({ toolName }: { toolName: string }) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/history?tool=${encodeURIComponent(toolName)}`)
      .then(r => r.json())
      .then(({ history }) => setHistory(history || []))
      .finally(() => setLoading(false))
  }, [toolName])

  async function handleCopy(id: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-white rounded-2xl border border-[#EDE8F5] animate-pulse" />
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="mt-4 bg-white rounded-2xl border border-[#EDE8F5] p-10 text-center">
        <Clock className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
        <p className="text-sm text-[#999]">まだ履歴がありません</p>
        <p className="text-xs text-[#bbb] mt-1">「作成」タブで試してみてください</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 mt-4">
      {history.map(item => {
        const isOpen = expanded === item.id
        return (
          <div key={item.id} className="bg-white rounded-2xl border border-[#EDE8F5] overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : item.id)}
              className="w-full p-4 flex items-start gap-3 text-left hover:bg-[#FAF7FD] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#bbb] mb-0.5">{formatDate(item.created_at)}</p>
                <p className="text-sm text-[#444] truncate">{item.input_summary}</p>
              </div>
              {isOpen
                ? <ChevronUp className="w-4 h-4 text-[#bbb] flex-shrink-0 mt-1" />
                : <ChevronDown className="w-4 h-4 text-[#bbb] flex-shrink-0 mt-1" />
              }
            </button>

            {isOpen && (
              <div className="border-t border-[#EDE8F5] px-4 py-4 bg-[#FAF7FD]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-[#999]">回答</p>
                  <button
                    onClick={() => handleCopy(item.id, item.output)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#EDE8F5] text-[#666] hover:bg-white transition-colors"
                  >
                    {copied === item.id
                      ? <><Check className="w-3 h-3 text-green-500" /><span className="text-green-500">コピー済</span></>
                      : <><Copy className="w-3 h-3" /><span>コピー</span></>
                    }
                  </button>
                </div>
                <div className="text-sm text-[#444] leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                  {item.output}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
