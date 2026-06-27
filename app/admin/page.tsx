export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Users, MessageSquare, CreditCard, BookOpen } from 'lucide-react'

async function getStats() {
  const supabase = await createClient()

  const [usersResult, sessionsResult, activeSubsResult, knowledgeResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('knowledge_base').select('id', { count: 'exact', head: true }),
  ])

  return {
    users: usersResult.count ?? 0,
    sessions: sessionsResult.count ?? 0,
    activeSubscriptions: activeSubsResult.count ?? 0,
    knowledgeChunks: knowledgeResult.count ?? 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    { icon: Users, label: '総会員数', value: stats.users, unit: '人' },
    { icon: CreditCard, label: '有効サブスク', value: stats.activeSubscriptions, unit: '件' },
    { icon: MessageSquare, label: '総チャット数', value: stats.sessions, unit: '件' },
    { icon: BookOpen, label: '知識ベース', value: stats.knowledgeChunks, unit: '件' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333] mb-8">ダッシュボード</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ icon: Icon, label, value, unit }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <div className="w-9 h-9 bg-[#E8D5F5] rounded-xl flex items-center justify-center mb-3">
              <Icon className="w-4.5 h-4.5 text-[#9B6DC3]" />
            </div>
            <div className="text-2xl font-bold text-[#333]">
              {value.toLocaleString()}
              <span className="text-sm font-normal text-[#999] ml-1">{unit}</span>
            </div>
            <div className="text-xs text-[#999] mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#EDE8F5] p-6">
        <h2 className="font-bold text-[#333] mb-4">クイックリンク</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/admin/knowledge" className="p-4 rounded-xl border border-[#EDE8F5] hover:border-[#C9A8E2] hover:bg-[#FAF7FD] transition-colors">
            <div className="font-medium text-[#333] text-sm mb-1">知識ベースに追加する</div>
            <div className="text-xs text-[#999]">文字起こしデータをAIに学習させる</div>
          </a>
          <a href="/admin/prompts" className="p-4 rounded-xl border border-[#EDE8F5] hover:border-[#C9A8E2] hover:bg-[#FAF7FD] transition-colors">
            <div className="font-medium text-[#333] text-sm mb-1">AIプロンプトを改善する</div>
            <div className="text-xs text-[#999]">みなみさんの回答スタイルを調整する</div>
          </a>
          <a href="/admin/announcements" className="p-4 rounded-xl border border-[#EDE8F5] hover:border-[#C9A8E2] hover:bg-[#FAF7FD] transition-colors">
            <div className="font-medium text-[#333] text-sm mb-1">お知らせを投稿する</div>
            <div className="text-xs text-[#999]">会員へのお知らせを作成・公開する</div>
          </a>
          <a href="/admin/users" className="p-4 rounded-xl border border-[#EDE8F5] hover:border-[#C9A8E2] hover:bg-[#FAF7FD] transition-colors">
            <div className="font-medium text-[#333] text-sm mb-1">会員を確認する</div>
            <div className="text-xs text-[#999]">登録会員の一覧・詳細を確認する</div>
          </a>
        </div>
      </div>
    </div>
  )
}
