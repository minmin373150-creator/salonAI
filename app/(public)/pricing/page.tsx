'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import Logo from '@/components/ui/Logo'

const FEATURES = [
  '24時間いつでもAIに相談し放題',
  '集客・リピート・接客・カウンセリングに対応',
  '山崎みなみのコンサルノウハウをAI化',
  'すぐ使えるテンプレート付きで回答',
  '過去のチャット履歴を保存・検索',
  '画像・PDFのアップロード対応',
  '音声でも入力できる',
  'スマホから使いやすいデザイン',
]

export default function PricingPage() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    if (res.status === 401) {
      window.location.href = '/register'
      return
    }
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FAF7FD]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#EDE8F5] bg-white">
        <Link href="/">
          <Logo />
        </Link>
        <Link href="/login" className="text-sm text-[#666] hover:text-[#333]">
          ログイン
        </Link>
      </header>

      <main className="px-4 py-16 max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 bg-[#E8D5F5] text-[#9B6DC3] text-sm font-medium px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            シンプルな料金設定
          </div>
          <h1 className="text-2xl font-bold text-[#333] mb-3">
            月額5,500円（税込）
          </h1>
          <p className="text-[#666] text-sm leading-relaxed">
            1日あたり約180円で、24時間いつでも<br />
            美容サロン専門AIコンサルに相談できます。
          </p>
        </div>

        <div className="bg-white border-2 border-[#C9A8E2] rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col gap-3 mb-8">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E8D5F5] flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-[#9B6DC3]" />
                </div>
                <span className="text-sm text-[#333] leading-snug">{feature}</span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full"
            loading={loading}
            onClick={handleSubscribe}
          >
            今すぐ始める
          </Button>
          <p className="text-center text-xs text-[#999] mt-3">
            いつでもキャンセル可能・クレジットカード決済
          </p>
        </div>

        <p className="text-center text-sm text-[#999] mt-8">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-[#C9A8E2] hover:underline">
            こちら
          </Link>
        </p>
      </main>
    </div>
  )
}
