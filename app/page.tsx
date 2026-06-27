import Link from 'next/link'
import { MessageSquare, Repeat, Users, BookOpen, Check, ArrowRight } from 'lucide-react'
import Logo from '@/components/ui/Logo'

const FEATURES = [
  { icon: MessageSquare, title: '集客の相談', desc: 'ホットペッパー・Instagram・LINE集客を具体的にアドバイス' },
  { icon: Repeat, title: 'リピート率UP', desc: 'お客様が自然と戻ってくる接客・フォローの仕組みを提案' },
  { icon: Users, title: 'カウンセリング', desc: '悩みを引き出す質問の順番・言葉の選び方を徹底サポート' },
  { icon: BookOpen, title: 'テンプレート付き', desc: 'LINEの文章・DM・メニュー説明文がそのまま使える形で提供' },
]

const PLAN_FEATURES = [
  '24時間いつでもAIに相談し放題',
  '過去チャット保存・検索',
  '画像・PDFアップロード',
  '音声入力対応',
  'スマホ最適化デザイン',
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ナビ */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#EDE8F5]">
        <Logo />
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-[#666] hover:text-[#333]">
            ログイン
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-[#C9A8E2] text-white px-4 py-2 rounded-xl hover:bg-[#B894D4] transition-colors"
          >
            無料で始める
          </Link>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="px-6 py-16 md:py-24 text-center max-w-2xl mx-auto">
        <div className="inline-block bg-[#E8D5F5] text-[#9B6DC3] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          美容サロンオーナー専用 AIコンサル
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#333] mb-5 leading-tight">
          24時間いつでも<br />
          <span className="text-[#C9A8E2]">みなみのコンサル</span>を<br />
          AIで受けられる
        </h1>
        <p className="text-[#666] text-base leading-relaxed mb-8">
          集客・リピート・接客・カウンセリング。<br />
          すべての悩みにすぐ実践できる答えを。
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-[#C9A8E2] text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-[#B894D4] transition-colors shadow-sm"
        >
          今すぐ始める
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-sm text-[#999] mt-3">月額5,500円（税込）・いつでもキャンセル可</p>
      </section>

      {/* 特徴 */}
      <section className="px-6 py-12 bg-[#FAF7FD]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-center text-[#333] mb-8">
            こんな悩みを解決します
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-[#EDE8F5]">
                <div className="w-10 h-10 bg-[#E8D5F5] rounded-xl flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#9B6DC3]" />
                </div>
                <h3 className="font-bold text-[#333] mb-1">{title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section className="px-6 py-12">
        <div className="max-w-sm mx-auto text-center">
          <h2 className="text-xl font-bold text-[#333] mb-6">シンプルな料金</h2>
          <div className="bg-white border-2 border-[#C9A8E2] rounded-2xl p-8">
            <div className="text-3xl font-bold text-[#333] mb-1">5,500<span className="text-lg">円</span></div>
            <div className="text-sm text-[#999] mb-6">月額（税込）</div>
            <div className="flex flex-col gap-2.5 text-left mb-7">
              {PLAN_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#E8D5F5] flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[#9B6DC3]" />
                  </div>
                  <span className="text-sm text-[#333]">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/register"
              className="block w-full bg-[#C9A8E2] text-white py-3.5 rounded-xl font-medium text-center hover:bg-[#B894D4] transition-colors"
            >
              今すぐ始める
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="px-6 py-8 border-t border-[#EDE8F5] text-center">
        <div className="flex justify-center mb-4">
          <Logo size="sm" />
        </div>
        <div className="flex justify-center gap-6 text-xs text-[#999] mb-3">
          <Link href="/terms" className="hover:text-[#666]">利用規約</Link>
          <Link href="/privacy" className="hover:text-[#666]">プライバシーポリシー</Link>
          <Link href="/contact" className="hover:text-[#666]">お問い合わせ</Link>
        </div>
        <p className="text-xs text-[#bbb]">© 2025 サロンAI</p>
      </footer>
    </div>
  )
}
