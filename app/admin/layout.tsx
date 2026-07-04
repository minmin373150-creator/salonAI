export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/isAdmin'
import Link from 'next/link'
import { Users, CreditCard, Shield, LayoutDashboard, History } from 'lucide-react'
import Logo from '@/components/ui/Logo'

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'ダッシュボード' },
  { href: '/admin/users', icon: Users, label: 'ユーザー管理' },
  { href: '/admin/history', icon: History, label: '使用履歴' },
  { href: '/admin/members', icon: CreditCard, label: '会員管理' },
  { href: '/admin/admins', icon: Shield, label: '管理者一覧' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin()
  if (!admin) redirect('/chat')
  return (
    <div className="flex min-h-screen bg-[#FAF7FD]">
      {/* サイドバー */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-[#EDE8F5] flex flex-col">
        <div className="p-5 border-b border-[#EDE8F5]">
          <Logo size="sm" />
          <p className="text-xs text-[#999] mt-1 ml-11">管理画面</p>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[#555] hover:bg-[#FAF7FD] hover:text-[#333] transition-colors"
            >
              <Icon className="w-4 h-4 text-[#C9A8E2]" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-3 border-t border-[#EDE8F5]">
          <Link href="/chat" className="flex items-center gap-2 px-3 py-2 text-xs text-[#999] hover:text-[#666] rounded-xl hover:bg-[#FAF7FD]">
            ← ユーザー画面へ
          </Link>
        </div>
      </aside>

      {/* コンテンツ */}
      <main className="flex-1 min-w-0 p-8">
        {children}
      </main>
    </div>
  )
}
