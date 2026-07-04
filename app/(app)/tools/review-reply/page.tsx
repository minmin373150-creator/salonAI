'use client'

import { useState } from 'react'
import { saveHistory } from '@/lib/saveHistory'
import Link from 'next/link'
import { ArrowLeft, Star, Loader, Copy, Check } from 'lucide-react'
import Button from '@/components/ui/Button'

const SALON_TYPES = [
  'エステ', '整体・カイロ', 'ネイル', 'アイラッシュ',
  '美容室', 'リラクゼーション', 'その他',
]

export default function ReviewReplyPage() {
  const [salonType, setSalonType] = useState('')
  const [review, setReview] = useState('')
  const [concern, setConcern] = useState('')
  const [result, setResult] = useState('')
  const [method, setMethod] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!review.trim() || !concern.trim()) return

    setLoading(true)
    setOutput('')

    try {
      const res = await fetch('/api/tools/review-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review, concern, result, method, salonType }),
      })

      if (!res.ok) throw new Error()

      const reader = res.body?.getReader()
      if (!reader) throw new Error()

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setOutput(accumulated)
      }
      await saveHistory('口コミ返信作成', review.substring(0, 100), accumulated)
    } catch {
      setOutput('エラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canSubmit = review.trim() && concern.trim()

  return (
    <div className="min-h-screen bg-[#FAF7FD]">
      {/* ヘッダー */}
      <header className="bg-white border-b border-[#EDE8F5] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/chat"
            className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8F0] flex items-center justify-center">
              <Star className="w-4 h-4 text-[#E86A9A]" />
            </div>
            <h1 className="font-bold text-[#333]">口コミ返信作成</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* 業種選択 */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-3 block">業種</label>
            <div className="flex flex-wrap gap-2">
              {SALON_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSalonType(type)}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                    salonType === type
                      ? 'bg-[#C9A8E2] text-white border-[#C9A8E2]'
                      : 'bg-white text-[#666] border-[#EDE8F5] hover:border-[#C9A8E2]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 1️⃣ 口コミ */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              1️⃣ もらった口コミを貼り付けてください
              <span className="text-[#E86A9A] ml-1">*</span>
            </label>
            <p className="text-xs text-[#999] mb-3">ホットペッパー・Googleマップなど、そのまま貼り付けでOK</p>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="例：先生にカウンセリングしていただき、長年気になっていた肩こりが1回でかなり楽になりました！説明も丁寧で、また来たいと思います。"
              rows={5}
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-y leading-relaxed"
            />
          </div>

          {/* 2️⃣ 返信に入れる要素 */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              2️⃣ 口コミ返信に入れる要素
            </label>
            <p className="text-xs text-[#999] mb-4">具体的に書くほど、刺さる返信になります</p>

            <div className="flex flex-col gap-4">
              {/* 悩み */}
              <div>
                <label className="text-xs font-bold text-[#555] mb-1.5 block flex items-center gap-1">
                  そのお客様はどんな悩みで来店したのか？
                  <span className="text-[#E86A9A]">*</span>
                </label>
                <textarea
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  placeholder="例：3年前から続く肩・首のガチガチのこり。デスクワークで姿勢が悪く、毎晩肩が痛くて眠れないほどだった"
                  rows={3}
                  className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-y leading-relaxed"
                />
              </div>

              {/* 結果 */}
              <div>
                <label className="text-xs font-bold text-[#555] mb-1.5 block">
                  その悩みがどうなったのか？
                </label>
                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="例：1回の施術で首が左右に回るようになり、施術後その日の夜は久しぶりにぐっすり眠れたと言っていた"
                  rows={3}
                  className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-y leading-relaxed"
                />
              </div>

              {/* 方法 */}
              <div>
                <label className="text-xs font-bold text-[#555] mb-1.5 block">
                  具体的に何をしたから改善されたのか？
                </label>
                <textarea
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  placeholder="例：姿勢の歪みを整えてから肩甲骨まわりの筋肉をほぐし、血流を促すアプローチをした"
                  rows={3}
                  className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-y leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={loading}
              disabled={!canSubmit}
              size="lg"
            >
              {loading ? '作成中...' : '返信文を作成する'}
            </Button>
          </div>
        </form>

        {/* 結果表示 */}
        {(output || loading) && (
          <div className="mt-6 bg-white rounded-2xl border border-[#EDE8F5] p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#EDE8F5]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A8E2] to-[#F4A7C3] flex items-center justify-center text-white text-xs font-bold">
                  み
                </div>
                <span className="font-bold text-[#333]">作成された返信文</span>
                {loading && <Loader className="w-4 h-4 text-[#C9A8E2] animate-spin" />}
              </div>
              {output && !loading && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border border-[#EDE8F5] text-[#666] hover:bg-[#FAF7FD] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">コピーしました</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>コピー</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {output ? (
              <p className="text-sm text-[#333] leading-loose whitespace-pre-wrap">{output}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-[#F5F5F5] rounded animate-pulse" style={{ width: `${85 - i * 8}%` }} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
