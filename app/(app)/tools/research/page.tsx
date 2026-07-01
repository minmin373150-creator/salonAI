'use client'

import Link from 'next/link'
import { ArrowLeft, Star, Users, ChevronRight, BarChart2 } from 'lucide-react'

const SUB_TOOLS = [
  {
    href: '/tools/research/review',
    icon: Star,
    color: '#F59E0B',
    bg: '#FEF3CD',
    title: '口コミ分析',
    desc: 'HPBの口コミページURLを貼るだけで全件取得。強み・改善点・HPBに活かせるフレーズをまとめて分析。',
    badge: 'NEW',
    disabled: false,
  },
  {
    href: '/tools/research/competitor',
    icon: Users,
    color: '#9B6DC3',
    bg: '#E8D5F5',
    title: '競合リサーチ分析',
    desc: '競合サロンのURLを貼るだけでAIが自動取得・分析。キャッチコピー・価格帯・強みを比較して差別化ポイントを提案。',
    badge: 'SOON',
    disabled: true,
  },
]

export default function ResearchHubPage() {
  return (
    <div className="min-h-screen bg-[#FAF7FD]">
      <header className="bg-white border-b border-[#EDE8F5] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D5EAF5] flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-[#4A9FC3]" />
            </div>
            <h1 className="font-bold text-[#333]">自社・競合リサーチ分析</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-[#666] mb-6">
          ホットペッパービューティーでの自社の掲載状況や、競合サロンの動向を分析します。
        </p>

        <div className="flex flex-col gap-3">
          {SUB_TOOLS.map(({ href, icon: Icon, color, bg, title, desc, badge, disabled }) =>
            disabled ? (
              <div
                key={href}
                className="bg-white rounded-2xl border border-[#EDE8F5] p-5 flex items-start gap-4 opacity-60"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#999]">{title}</span>
                    <span className="text-xs bg-[#F5F5F5] text-[#bbb] px-2 py-0.5 rounded-full">{badge}</span>
                  </div>
                  <p className="text-sm text-[#bbb] leading-relaxed">{desc}</p>
                </div>
              </div>
            ) : (
              <Link
                key={href}
                href={href}
                className="bg-white rounded-2xl border-2 border-[#C9A8E2] p-5 flex items-start gap-4 hover:bg-[#FAF7FD] transition-colors group"
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#333]">{title}</span>
                    {badge && (
                      <span className="text-xs bg-[#F4A7C3] text-white px-2 py-0.5 rounded-full font-medium">{badge}</span>
                    )}
                  </div>
                  <p className="text-sm text-[#666] leading-relaxed">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#bbb] flex-shrink-0 mt-1" />
              </Link>
            )
          )}
        </div>
      </main>
    </div>
  )
}
