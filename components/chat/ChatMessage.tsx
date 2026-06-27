'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ChatMessage as ChatMessageType } from '@/types'

interface Props {
  message: ChatMessageType
}

export default function ChatMessage({ message }: Props) {
  const [copied, setCopied] = useState(false)
  const isAssistant = message.role === 'assistant'

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'flex gap-3 chat-bubble-enter',
        isAssistant ? 'justify-start' : 'justify-end'
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A8E2] to-[#F4A7C3] flex items-center justify-center text-white text-xs font-bold">
          AI
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 relative group',
          isAssistant
            ? 'bg-white border border-[#EDE8F5] text-[#333] rounded-tl-sm'
            : 'bg-[#C9A8E2] text-white rounded-tr-sm'
        )}
      >
        {isAssistant ? (
          <>
            <div className="prose prose-sm max-w-none text-[#333] leading-relaxed
              prose-headings:text-[#333] prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1
              prose-p:my-1 prose-p:leading-relaxed
              prose-ul:my-1 prose-li:my-0.5
              prose-strong:text-[#C9A8E2] prose-strong:font-semibold
              prose-hr:border-[#EDE8F5] prose-hr:my-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[#FAF7FD]"
              title="コピー"
            >
              {copied
                ? <Check className="w-3.5 h-3.5 text-[#C9A8E2]" />
                : <Copy className="w-3.5 h-3.5 text-[#999]" />
              }
            </button>
          </>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}
      </div>
    </div>
  )
}
