'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Stethoscope, FileText, Star, Type, MessageSquare, Lock, Store, ChevronRight } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const TOOLS = [
  {
    id: 'counseling-review',
    icon: Stethoscope,
    title: 'カウンセリング添削',
    desc: '文字起こしを貼るだけで、みなみ流の視点で徹底分析。話す割合・質問力・共感力・NGワードまで丸ごと診断。',
    href: '/tools/counseling-review',
    available: true,
    badge: 'NEW',
  },
  {
    id: 'blog',
    icon: FileText,
    title: 'ブログ作成',
    desc: 'テーマを入れるだけで予約率が上がるブログをAIが作成。PREP法で書かれた、見込み客の背中を押す記事に。',
    href: '/tools/blog',
    available: true,
    badge: 'NEW',
  },
  {
    id: 'review-reply',
    icon: Star,
    title: '口コミ返信作成',
    desc: '良い口コミも悪い口コミも、みなみ流の温かい返信文をAIが作成。見込み客の予約後押しになる返信が作れます。',
    href: '/tools/review-reply',
    available: true,
    badge: 'NEW',
  },
  {
    id: 'catchcopy',
    icon: Type,
    title: 'キャッチコピー作成',
    desc: 'ホットペッパーのトップページ・クーポン・特集に使える、予約につながるコピーをセットで10案提案。',
    href: '/tools/catchcopy',
    available: true,
    badge: 'NEW',
  },
  {
    id: 'counseling-roleplay',
    icon: MessageSquare,
    title: 'カウンセリングロールプレイ',
    desc: 'AIがリアルなお客様役になり、カウンセリングの練習ができる。終了後にみなみが時系列で徹底添削。',
    href: '/tools/counseling-roleplay',
    available: true,
    badge: 'NEW',
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [salonName, setSalonName] = useState('')

  useEffect(() => {
    fetch('/api/salon-profile')
      .then(r => r.json())
      .then(({ profile }) => {
        setHasProfile(!!profile?.salon_type || !!profile?.salon_name)
        setSalonName(profile?.salon_name ?? '')
      })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#FAF7FD]">
      {/* ヘッダー */}
      <header className="bg-white border-b border-[#EDE8F5] px-6 py-4 flex items-center justify-between">
        <Logo />
        <button
          onClick={handleLogout}
          className="text-sm text-[#999] hover:text-[#666] transition-colors"
        >
          ログアウト
        </button>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* サロン情報バナー */}
        {hasProfile === false && (
          <Link
            href="/settings/salon"
            className="flex items-center gap-3 bg-gradient-to-r from-[#C9A8E2] to-[#F4A7C3] rounded-2xl p-4 mb-6 text-white hover:opacity-90 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">まずはサロン情報を登録しよう！</p>
              <p className="text-xs text-white/80 mt-0.5">業種・ターゲット・こだわりを登録すると、AIの出力がより精度高くなります</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0" />
          </Link>
        )}

        {hasProfile === true && (
          <Link
            href="/settings/salon"
            className="flex items-center gap-3 bg-white rounded-2xl border border-[#EDE8F5] p-4 mb-6 hover:bg-[#FAF7FD] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8D5F5] flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-[#9B6DC3]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-[#333]">
                {salonName || 'マイサロン'}
              </p>
              <p className="text-xs text-[#999] mt-0.5">サロン情報が登録されています・編集する</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#bbb]" />
          </Link>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#333] mb-2">
            ツール一覧
          </h1>
          <p className="text-sm text-[#666]">
            使いたいツールを選んでください
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {TOOLS.map(({ id, icon: Icon, title, desc, href, available, badge }) => (
            available ? (
              <Link
                key={id}
                href={href}
                className="bg-white rounded-2xl border-2 border-[#C9A8E2] p-5 flex items-start gap-4 hover:bg-[#FAF7FD] transition-colors group"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#E8D5F5] flex items-center justify-center group-hover:bg-[#C9A8E2] transition-colors">
                  <Icon className="w-5 h-5 text-[#9B6DC3] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#333]">{title}</span>
                    {badge && (
                      <span className="text-xs bg-[#F4A7C3] text-white px-2 py-0.5 rounded-full font-medium">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#666] leading-relaxed">{desc}</p>
                </div>
              </Link>
            ) : (
              <div
                key={id}
                className="bg-white rounded-2xl border border-[#EDE8F5] p-5 flex items-start gap-4 opacity-60"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#bbb]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#999]">{title}</span>
                    <span className="text-xs bg-[#F5F5F5] text-[#bbb] px-2 py-0.5 rounded-full">
                      準備中
                    </span>
                  </div>
                  <p className="text-sm text-[#bbb] leading-relaxed">{desc}</p>
                </div>
              </div>
            )
          ))}
        </div>
      </main>
    </div>
  )
}
