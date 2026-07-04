export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

async function getHistory() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tool_history')
    .select('*, salon_profiles(salon_name)')
    .order('created_at', { ascending: false })
    .limit(300)
  return data || []
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const TOOL_COLORS: Record<string, string> = {
  'カウンセリング添削': 'bg-purple-100 text-purple-700',
  'ブログ作成': 'bg-blue-100 text-blue-700',
  '口コミ返信作成': 'bg-yellow-100 text-yellow-700',
  'カウンセリングロールプレイ': 'bg-pink-100 text-pink-700',
  '口コミ分析': 'bg-orange-100 text-orange-700',
  '競合リサーチ分析': 'bg-green-100 text-green-700',
}

export default async function AdminHistoryPage() {
  const history = await getHistory()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333] mb-6">使用履歴</h1>
      <p className="text-sm text-[#999] mb-4">全ユーザーの使用履歴（最新{history.length}件）</p>

      <div className="bg-white rounded-2xl border border-[#EDE8F5] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7FD] border-b border-[#EDE8F5]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">日時</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">サロン名</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">ツール</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#666]">入力内容</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h: any) => (
              <tr key={h.id} className="border-b border-[#EDE8F5] last:border-0 hover:bg-[#FAF7FD]">
                <td className="px-4 py-3 text-[#999] whitespace-nowrap">{formatDate(h.created_at)}</td>
                <td className="px-4 py-3 text-[#333]">{h.salon_profiles?.salon_name || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TOOL_COLORS[h.tool_name] || 'bg-gray-100 text-gray-600'}`}>
                    {h.tool_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#666] max-w-xs truncate">{h.input_summary}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[#999] text-sm">履歴がありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
