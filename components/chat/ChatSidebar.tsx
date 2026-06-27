'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, MessageSquare, LogOut, Settings, Search, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import type { ChatSession } from '@/types'
import Logo from '@/components/ui/Logo'

interface Props {
  sessions: ChatSession[]
  onNewChat: () => void
  onClose?: () => void
}

export default function ChatSidebar({ sessions, onNewChat, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full bg-[#FAF7FD] border-r border-[#EDE8F5]">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-[#EDE8F5]">
        <Logo size="sm" />
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#999] hover:bg-[#EDE8F5] md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 新規チャットボタン */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#C9A8E2] text-white text-sm font-medium hover:bg-[#B894D4] transition-colors"
        >
          <Plus className="w-4 h-4" />
          新しい相談を始める
        </button>
      </div>

      {/* 検索 */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 bg-white border border-[#EDE8F5] rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-[#bbb] flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="チャット履歴を検索"
            className="flex-1 text-sm text-[#333] placeholder-[#bbb] bg-transparent outline-none"
          />
        </div>
      </div>

      {/* チャット履歴一覧 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
        {filteredSessions.length === 0 ? (
          <p className="text-xs text-[#bbb] text-center py-4">
            {searchQuery ? '見つかりません' : 'まだ相談履歴がありません'}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredSessions.map((session) => {
              const isActive = pathname === `/chat/${session.id}`
              return (
                <Link
                  key={session.id}
                  href={`/chat/${session.id}`}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors group',
                    isActive
                      ? 'bg-[#E8D5F5] text-[#333] font-medium'
                      : 'text-[#555] hover:bg-white'
                  )}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0 text-[#C9A8E2]" />
                  <span className="truncate">{session.title}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="border-t border-[#EDE8F5] p-3 flex flex-col gap-1">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#555] hover:bg-white transition-colors"
        >
          <Settings className="w-4 h-4 text-[#C9A8E2]" />
          アカウント設定
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#555] hover:bg-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4 text-[#999]" />
          ログアウト
        </button>
      </div>
    </div>
  )
}
