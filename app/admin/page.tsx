export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Users, History, CreditCard, Shield } from 'lucide-react'
import Link from 'next/link'

async function getStats() {
  const supabase = await createClient()
  const [profilesResult, historyResult, adminsResult] = await Promise.all([
    supabase.from('salon_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('tool_history').select('id', { count: 'exact', head: true }),
    supabase.from('admins').select('id', { count: 'exact', head: true }),
  ])
  return {
    users: profilesResult.count ?? 0,
    toolUses: historyResult.count ?? 0,
    admins: adminsResult.count ?? 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    { icon: Users, label: 'ユーザー数', value: stats.users, unit: '人', href: '/admin/users' },
    { icon: History, label: 'ツール使用回数', value: stats.toolUses, unit: '回', href: '/admin/history' },
    { icon: Shield, label: '管理者数', value: stats.admins, unit: '人', href: '/admin/admins' },
  ]

  const links = [
    { href: '/admin/users', title: 'ユーザー管理', desc: '登録ユーザーの一覧・サロン情報を確認' },
    { href: '/admin/history', title: '使用履歴', desc: '全ユーザーのツール使用履歴を確認' },
    { href: '/admin/members', title: '会員管理', desc: '有料プラン・退会申請の管理' },
    { href: '/admin/admins', title: '管理者一覧', desc: '管理者の追加・削除' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333] mb-8">管理者ダッシュボード</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map(({ icon: Icon, label, value, unit, href }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl border border-[#EDE8F5] p-5 hover:border-[#C9A8E2] transition-colors">
            <div className="w-9 h-9 bg-[#E8D5F5] rounded-xl flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-[#9B6DC3]" />
            </div>
            <div className="text-2xl font-bold text-[#333]">
              {value.toLocaleString()}
              <span className="text-sm font-normal text-[#999] ml-1">{unit}</span>
            </div>
            <div className="text-xs text-[#999] mt-1">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {links.map(({ href, title, desc }) => (
          <Link key={href} href={href} className="bg-white rounded-2xl border border-[#EDE8F5] p-5 hover:border-[#C9A8E2] hover:bg-[#FAF7FD] transition-colors">
            <p className="font-bold text-[#333] text-sm mb-1">{title}</p>
            <p className="text-xs text-[#999]">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
