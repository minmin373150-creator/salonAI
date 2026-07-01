'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, MapPin, Loader, Trophy, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

type Result = {
  found: boolean
  page?: number
  totalPages?: number
  positionInPage?: number
  overallPosition?: number
  salonNameFound?: string
  nearbyNames?: string[]
  message?: string
}

export default function OwnResearchPage() {
  const [areaUrl, setAreaUrl] = useState('')
  const [salonName, setSalonName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!areaUrl.trim() || !salonName.trim()) return
    setLoading(true)
    setResult(null)
    setError('')

    try {
      const res = await fetch('/api/tools/research/own', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaUrl, salonName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'エラーが発生しました')
      } else {
        setResult(data)
      }
    } catch {
      setError('通信エラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7FD]">
      <header className="bg-white border-b border-[#EDE8F5] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/tools/research" className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D5EAF5] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#4A9FC3]" />
            </div>
            <h1 className="font-bold text-[#333]">自社リサーチ分析 ― 掲載順位チェック</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* サロン名 */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              自分のサロン名
            </label>
            <p className="text-xs text-[#999] mb-3">HPBに登録されているサロン名をそのまま入力（部分一致でも検索できます）</p>
            <input
              type="text"
              value={salonName}
              onChange={e => setSalonName(e.target.value)}
              placeholder="例：ネイルサロン〇〇 心斎橋店"
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#4A9FC3] focus:border-transparent"
            />
          </div>

          {/* エリアURL */}
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
            <label className="text-sm font-bold text-[#333] mb-1 block">
              調べたいエリアのURL
            </label>
            <p className="text-xs text-[#999] mb-3">HPBでエリア検索したときのURLをそのまま貼ってください（小エリア・中エリアどちらもOK）</p>
            <input
              type="text"
              value={areaUrl}
              onChange={e => setAreaUrl(e.target.value)}
              placeholder="例：https://beauty.hotpepper.jp/nail/svcSB/macBB/salon/sacX080/"
              className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#4A9FC3] focus:border-transparent"
            />
            <div className="mt-3 bg-[#FAF7FD] rounded-xl p-3">
              <p className="text-xs text-[#666] font-bold mb-1">📌 URLの見つけ方</p>
              <p className="text-xs text-[#888] leading-relaxed">
                HPBでカテゴリ（ネイル等）→ 都道府県 → 中エリア or 小エリア を選択したときのURLをコピーしてください。
              </p>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={!areaUrl.trim() || !salonName.trim()}
            size="lg"
            className="w-full"
            style={{ backgroundColor: '#4A9FC3', borderColor: '#4A9FC3' }}
          >
            {loading ? '全ページを検索中...' : '掲載順位を調べる'}
          </Button>

          {loading && (
            <div className="flex items-center gap-2 justify-center text-sm text-[#4A9FC3]">
              <Loader className="w-4 h-4 animate-spin" />
              <span>全ページを順番に検索しています。しばらくお待ちください…</span>
            </div>
          )}
        </form>

        {/* エラー */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 結果 */}
        {result && (
          <div className="mt-6">
            {result.found ? (
              <div className="flex flex-col gap-4">
                {/* メイン結果 */}
                <div className="bg-white rounded-2xl border-2 border-[#4A9FC3] p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#D5EAF5] flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-7 h-7 text-[#4A9FC3]" />
                  </div>
                  <p className="text-[#666] text-sm mb-2">{salonName}</p>
                  <p className="text-3xl font-bold text-[#333] mb-1">
                    {result.page}ページ目の <span className="text-[#4A9FC3]">{result.positionInPage}番目</span>
                  </p>
                  <p className="text-sm text-[#999]">
                    全体で {result.overallPosition}番目 ／ 全{result.totalPages}ページ
                  </p>
                </div>

                {/* 前後のサロン */}
                {result.nearbyNames && result.nearbyNames.length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
                    <p className="text-sm font-bold text-[#333] mb-3">📍 前後のサロン</p>
                    <div className="flex flex-col gap-2">
                      {result.nearbyNames.map((name, i) => {
                        const isTarget = name === result.salonNameFound
                        const pos = (result.page! - 1) * 20 + (result.positionInPage! - (result.nearbyNames!.indexOf(result.salonNameFound!) - i))
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${
                              isTarget
                                ? 'bg-[#D5EAF5] border border-[#4A9FC3]'
                                : 'bg-[#FAF7FD] border border-[#EDE8F5]'
                            }`}
                          >
                            <span className={`text-xs font-bold w-12 flex-shrink-0 ${isTarget ? 'text-[#4A9FC3]' : 'text-[#bbb]'}`}>
                              {pos}番目
                            </span>
                            <span className={`text-sm ${isTarget ? 'font-bold text-[#333]' : 'text-[#666]'}`}>
                              {name}
                            </span>
                            {isTarget && <span className="text-xs bg-[#4A9FC3] text-white px-2 py-0.5 rounded-full ml-auto flex-shrink-0">自社</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* アドバイス */}
                <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
                  <p className="text-sm font-bold text-[#333] mb-2">💡 順位の見方</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { range: '1〜20位（1ページ目）', eval: '最高！そのままキープ', color: 'text-green-600' },
                      { range: '21〜40位（2ページ目）', eval: '口コミ数・写真枚数を増やすと上がりやすい', color: 'text-blue-600' },
                      { range: '41〜60位（3ページ目）', eval: 'クーポン数・更新頻度を見直そう', color: 'text-orange-500' },
                      { range: '61位以降', eval: 'ページ整備が急務。クーポン・写真・口コミを集中強化', color: 'text-red-500' },
                    ].map(({ range, eval: ev, color }) => (
                      <div key={range} className={`flex items-start gap-2 text-xs ${
                        result.overallPosition! <= 20 && color === 'text-green-600' ? 'font-bold' :
                        result.overallPosition! <= 40 && color === 'text-blue-600' ? 'font-bold' :
                        result.overallPosition! <= 60 && color === 'text-orange-500' ? 'font-bold' :
                        result.overallPosition! > 60 && color === 'text-red-500' ? 'font-bold' : 'opacity-50'
                      }`}>
                        <span className={`${color} font-bold flex-shrink-0`}>{range}</span>
                        <span className="text-[#666]">→ {ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#EDE8F5] p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[#FEF3CD] flex items-center justify-center mx-auto mb-3">
                  <Search className="w-7 h-7 text-[#F59E0B]" />
                </div>
                <p className="text-sm text-[#666]">{result.message}</p>
                <p className="text-xs text-[#999] mt-2">サロン名の一部（例：店舗名のみ）で試してみてください</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
