export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select(`
      *,
      subscriptions (status, current_period_end)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333] mb-2">会員管理</h1>
      <p className="text-sm text-[#666] mb-8">登録会員の一覧と契約状況を確認できます。</p>

      <div className="bg-white rounded-2xl border border-[#EDE8F5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EDE8F5] flex items-center justify-between">
          <h2 className="font-bold text-[#333]">会員一覧</h2>
          <span className="text-sm text-[#999]">{users?.length ?? 0}名</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EDE8F5] bg-[#FAF7FD]">
                <th className="text-left px-6 py-3 text-xs font-medium text-[#999]">名前</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#999]">メール</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#999]">契約状況</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#999]">次回更新</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#999]">登録日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE8F5]">
              {users?.map((user) => {
                const sub = (user.subscriptions as { status: string; current_period_end: string }[] | null)?.[0]
                return (
                  <tr key={user.id} className="hover:bg-[#FAF7FD]">
                    <td className="px-6 py-4 text-[#333] font-medium">{user.name ?? '未設定'}</td>
                    <td className="px-6 py-4 text-[#666]">{user.email}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub?.status} />
                    </td>
                    <td className="px-6 py-4 text-[#666]">
                      {sub?.current_period_end
                        ? format(new Date(sub.current_period_end), 'yyyy/MM/dd', { locale: ja })
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 text-[#999]">
                      {format(new Date(user.created_at), 'yyyy/MM/dd', { locale: ja })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: '有効', className: 'bg-green-100 text-green-700' },
    trialing: { label: 'トライアル', className: 'bg-blue-100 text-blue-700' },
    past_due: { label: '支払い遅延', className: 'bg-yellow-100 text-yellow-700' },
    canceled: { label: 'キャンセル', className: 'bg-[#F5F5F5] text-[#999]' },
  }

  const config = status ? map[status] : null

  if (!config) {
    return <span className="text-xs text-[#bbb]">未契約</span>
  }

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
      {config.label}
    </span>
  )
}
