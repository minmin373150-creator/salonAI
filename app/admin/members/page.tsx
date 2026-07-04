export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

async function getMembers() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('salon_profiles')
    .select('*')
    .order('created_at', { ascending: false })
  return profiles || []
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })
}

export default async function AdminMembersPage() {
  const members = await getMembers()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333] mb-2">会員管理</h1>
      <p className="text-sm text-[#999] mb-6">※ Stripe連携後、プラン・課金状況が自動表示されます</p>

      <div className="bg-white rounded-2xl border border-[#EDE8F5] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7FD] border-b border-[#EDE8F5]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">サロン名</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">業種</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">登録日</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">プラン</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.user_id} className="border-b border-[#EDE8F5] last:border-0 hover:bg-[#FAF7FD]">
                <td className="px-4 py-3 font-medium text-[#333]">{m.salon_name || '未設定'}</td>
                <td className="px-4 py-3 text-[#666]">{m.salon_type || '-'}</td>
                <td className="px-4 py-3 text-[#999]">{formatDate(m.created_at)}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-[#E8D5F5] text-[#9B6DC3] px-2 py-0.5 rounded-full">無料（β）</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">有効</span>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[#999] text-sm">会員がいません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
