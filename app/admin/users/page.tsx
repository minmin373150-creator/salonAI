export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

async function getUsers() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('salon_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: history } = await supabase
    .from('tool_history')
    .select('user_id, tool_name, created_at')

  const userStats: Record<string, { count: number; lastUsed: string; tools: string[] }> = {}
  for (const h of history || []) {
    if (!userStats[h.user_id]) userStats[h.user_id] = { count: 0, lastUsed: h.created_at, tools: [] }
    userStats[h.user_id].count++
    if (h.created_at > userStats[h.user_id].lastUsed) userStats[h.user_id].lastUsed = h.created_at
    if (!userStats[h.user_id].tools.includes(h.tool_name)) userStats[h.user_id].tools.push(h.tool_name)
  }

  return { profiles: profiles || [], userStats }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
}

export default async function AdminUsersPage() {
  const { profiles, userStats } = await getUsers()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333] mb-6">ユーザー管理</h1>
      <p className="text-sm text-[#999] mb-4">登録ユーザー {profiles.length}人</p>

      <div className="bg-white rounded-2xl border border-[#EDE8F5] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7FD] border-b border-[#EDE8F5]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">サロン名</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">業種</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">登録日</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">使用回数</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">最終使用</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">使用ツール</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => {
              const stat = userStats[p.user_id]
              return (
                <tr key={p.user_id} className="border-b border-[#EDE8F5] last:border-0 hover:bg-[#FAF7FD]">
                  <td className="px-4 py-3 font-medium text-[#333]">{p.salon_name || '未設定'}</td>
                  <td className="px-4 py-3 text-[#666]">{p.salon_type || '-'}</td>
                  <td className="px-4 py-3 text-[#999]">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-[#9B6DC3]">{stat?.count ?? 0}</span>
                    <span className="text-[#999] text-xs ml-0.5">回</span>
                  </td>
                  <td className="px-4 py-3 text-[#999]">{stat?.lastUsed ? formatDate(stat.lastUsed) : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {stat?.tools.map(t => (
                        <span key={t} className="text-xs bg-[#E8D5F5] text-[#9B6DC3] px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
            {profiles.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#999] text-sm">まだユーザーがいません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
