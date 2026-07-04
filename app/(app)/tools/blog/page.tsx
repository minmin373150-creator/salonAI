'use client'

import { useState } from 'react'
import { saveHistory } from '@/lib/saveHistory'
import HistoryTab from '@/components/ui/HistoryTab'
import Link from 'next/link'
import { ArrowLeft, FileText, Loader, Copy, Check, ChevronRight, RotateCcw } from 'lucide-react'
import Button from '@/components/ui/Button'

const LENGTH_OPTIONS = [
  { value: 'short', label: 'ショート', desc: '300〜400文字' },
  { value: 'medium', label: 'スタンダード', desc: '500〜700文字' },
  { value: 'long', label: 'ロング', desc: '800〜1000文字' },
]

type Phase = 'target' | 'ideas' | 'write'

// 長い行を自動改行する関数
function formatBlogText(text: string): string {
  return text.split('\n').map(line => {
    // 空行・タイトル行・短い行はそのまま
    if (line.trim() === '' || line.startsWith('【') || line.length <= 25) return line
    // 25文字超の行を句読点で分割
    const result: string[] = []
    let current = ''
    for (const char of line) {
      current += char
      if ((char === '。' || char === '、') && current.length >= 15) {
        result.push(current)
        current = ''
      } else if (current.length >= 25 && char !== '」' && char !== '』') {
        result.push(current)
        current = ''
      }
    }
    if (current) result.push(current)
    return result.join('\n')
  }).join('\n')
}

// アイデアテキストを行ごとにパース
function parseIdeas(text: string): { category: string; items: string[] }[] {
  const result: { category: string; items: string[] }[] = []
  let current: { category: string; items: string[] } | null = null
  for (const line of text.split('\n')) {
    const cat = line.match(/^【(.+)】/)
    if (cat) {
      if (current) result.push(current)
      current = { category: cat[1], items: [] }
    } else if (line.startsWith('- ') && current) {
      current.items.push(line.replace(/^- /, '').trim())
    }
  }
  if (current) result.push(current)
  return result
}

const CATEGORY_COLOR: Record<string, string> = {
  '不安': 'bg-[#FEF0F5] text-[#D05080] border-[#F4A7C3]',
  '疑問': 'bg-[#F4EDFD] text-[#7B4FA0] border-[#C9A8E2]',
  '思い込み': 'bg-[#FFF8ED] text-[#A06820] border-[#F4C97C]',
  '疑い': 'bg-[#EDF5FE] text-[#2060A0] border-[#A7C4F4]',
}
const CATEGORY_BADGE: Record<string, string> = {
  '不安': 'bg-[#F4A7C3] text-white',
  '疑問': 'bg-[#C9A8E2] text-white',
  '思い込み': 'bg-[#F4C97C] text-white',
  '疑い': 'bg-[#A7C4F4] text-white',
}

export default function BlogPage() {
  const [tab, setTab] = useState<'create' | 'history'>('create')
  const [phase, setPhase] = useState<Phase>('target')
  const [target, setTarget] = useState('')
  const [ideasText, setIdeasText] = useState('')
  const [ideasLoading, setIdeasLoading] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState('')
  const [appeal, setAppeal] = useState('')
  const [length, setLength] = useState('medium')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // ステップ1：アイデア生成
  async function generateIdeas(e: React.FormEvent) {
    e.preventDefault()
    if (!target.trim()) return
    setIdeasLoading(true)
    setIdeasText('')
    try {
      const res = await fetch('/api/tools/blog/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      })
      const data = await res.json()
      setIdeasText(data.ideas)
      setPhase('ideas')
    } catch {
      alert('エラーが発生しました')
    } finally {
      setIdeasLoading(false)
    }
  }

  // ステップ2：アイデアを選んでブログ作成
  function selectIdea(idea: string) {
    setSelectedIdea(idea)
    setOutput('')
    setPhase('write')
  }

  // ブログ生成
  async function generateBlog(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedIdea) return
    setLoading(true)
    setOutput('')
    try {
      const res = await fetch('/api/tools/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: selectedIdea, target, appeal, length }),
      })
      const reader = res.body?.getReader()
      if (!reader) throw new Error()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setOutput(text)
      }
      await saveHistory('ブログ作成', selectedIdea.substring(0, 80), text)
    } catch {
      setOutput('エラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(formatBlogText(output))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const parsedIdeas = parseIdeas(ideasText)

  return (
    <div className="min-h-screen bg-[#FAF7FD]">
      <header className="bg-white border-b border-[#EDE8F5] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8D5F5] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#9B6DC3]" />
            </div>
            <h1 className="font-bold text-[#333]">ブログ作成</h1>
          </div>
          {/* ステップ表示 */}
          <div className="ml-auto flex items-center gap-1.5 text-xs">
            {['ターゲット', 'テーマ選択', 'ブログ作成'].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full font-bold ${
                  (phase === 'target' && i === 0) || (phase === 'ideas' && i === 1) || (phase === 'write' && i === 2)
                    ? 'bg-[#C9A8E2] text-white'
                    : i < (['target','ideas','write'].indexOf(phase)) ? 'bg-[#E8D5F5] text-[#9B6DC3]' : 'bg-[#F5F5F5] text-[#bbb]'
                }`}>{s}</span>
                {i < 2 && <ChevronRight className="w-3 h-3 text-[#ccc]" />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          {(['create', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${tab === t ? 'bg-[#C9A8E2] text-white' : 'bg-white text-[#999] border border-[#EDE8F5]'}`}>
              {t === 'create' ? '作成' : '履歴'}
            </button>
          ))}
        </div>
        {tab === 'history' && <HistoryTab toolName="ブログ作成" />}
        {tab === 'create' && <>
        {/* ============ ステップ1：ターゲット入力 ============ */}
        {phase === 'target' && (
          <form onSubmit={generateIdeas} className="flex flex-col gap-5">

            {/* タイトルエリア */}
            <div className="text-center py-4">
              <p className="text-2xl font-bold text-[#333] mb-2">まずはターゲットを決めよう！</p>
              <p className="text-sm text-[#666]">
                どんなお客様向けに書くかを入力すると<br />
                そのお客様が持っている<span className="text-[#9B6DC3] font-bold">不安・疑問・思い込み・疑い</span>が出てきます
              </p>
            </div>

            {/* ステップ説明 */}
            <div className="flex gap-3">
              {[
                { num: '1', label: 'ターゲット入力', active: true },
                { num: '2', label: 'テーマを選ぶ', active: false },
                { num: '3', label: 'ブログ完成！', active: false },
              ].map(s => (
                <div key={s.num} className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-bold ${s.active ? 'bg-[#C9A8E2] text-white' : 'bg-white border border-[#EDE8F5] text-[#bbb]'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${s.active ? 'bg-white text-[#9B6DC3]' : 'bg-[#F5F5F5] text-[#bbb]'}`}>{s.num}</span>
                  {s.label}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
              <label className="text-sm font-bold text-[#333] mb-1 block">
                どんなお客様向けのブログを書きますか？ <span className="text-[#E86A9A]">*</span>
              </label>
              <p className="text-xs text-[#999] mb-3">具体的なほど、リアルなテーマが出てきます</p>
              <textarea
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="例：ジェルネイルがすぐ浮いてしまう30代女性&#10;何度ダイエットしてもリバウンドしてしまう40代女性&#10;肩こりや腰痛が慢性的なデスクワーカー&#10;まつ毛パーマをしたことがない初めての方"
                rows={4}
                className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-none leading-relaxed"
              />
            </div>

            <Button type="submit" loading={ideasLoading} disabled={!target.trim()} size="lg" className="w-full">
              {ideasLoading ? '分析中...' : 'このターゲットの不安・疑問を出す →'}
            </Button>
          </form>
        )}

        {/* ============ ステップ2：テーマ選択 ============ */}
        {phase === 'ideas' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#333]">ターゲット：<span className="text-[#9B6DC3]">{target}</span></p>
                <p className="text-xs text-[#999] mt-0.5">ブログのテーマにしたい項目を1つ選んでください</p>
              </div>
              <button
                onClick={() => setPhase('target')}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-[#EDE8F5] text-[#666] hover:bg-[#FAF7FD] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                やり直す
              </button>
            </div>

            {parsedIdeas.map(({ category, items }) => (
              <div key={category} className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mb-3 ${CATEGORY_BADGE[category] || 'bg-[#999] text-white'}`}>
                  {category}
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => selectIdea(item)}
                      className={`text-left px-4 py-3 rounded-xl border text-sm transition-all hover:shadow-sm ${CATEGORY_COLOR[category] || 'bg-[#F5F5F5] text-[#333] border-[#EDE8F5]'}`}
                    >
                      <span className="leading-relaxed">{item}</span>
                      <span className="ml-2 text-xs opacity-60">→ これでブログを書く</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============ ステップ3：ブログ作成 ============ */}
        {phase === 'write' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPhase('ideas')}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-[#EDE8F5] text-[#666] hover:bg-[#FAF7FD] transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                テーマ選択に戻る
              </button>
            </div>

            {/* 選択したテーマ */}
            <div className="bg-[#F4EDFD] rounded-2xl px-5 py-4">
              <p className="text-xs text-[#999] mb-1">選んだテーマ</p>
              <p className="text-sm font-bold text-[#7B4FA0]">「{selectedIdea}」</p>
            </div>

            <form onSubmit={generateBlog} className="flex flex-col gap-4">
              {/* アピールポイント */}
              <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
                <label className="text-sm font-bold text-[#333] mb-1 block">
                  アピールしたいこと・施術のこだわり（任意）
                </label>
                <p className="text-xs text-[#999] mb-3">他店との違いを入れると差別化になります</p>
                <textarea
                  value={appeal}
                  onChange={e => setAppeal(e.target.value)}
                  placeholder="例：甘皮ケアにこだわって根元から整えるので4週間浮かない / カウンセリングで生活習慣まで聞くので根本から改善できる"
                  rows={3}
                  className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-none"
                />
              </div>

              {/* 文字数 */}
              <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
                <label className="text-sm font-bold text-[#333] mb-3 block">文字数</label>
                <div className="flex gap-3">
                  {LENGTH_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLength(opt.value)}
                      className={`flex-1 py-3 rounded-xl border text-sm transition-colors ${
                        length === opt.value
                          ? 'bg-[#C9A8E2] text-white border-[#C9A8E2]'
                          : 'bg-white text-[#666] border-[#EDE8F5] hover:border-[#C9A8E2]'
                      }`}
                    >
                      <p className="font-bold">{opt.label}</p>
                      <p className={`text-xs mt-0.5 ${length === opt.value ? 'text-white/80' : 'text-[#999]'}`}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" loading={loading} size="lg" className="w-full">
                {loading ? '作成中...' : 'ブログを作成する'}
              </Button>
            </form>

            {/* 出力 */}
            {(output || loading) && (
              <div className="bg-white rounded-2xl border border-[#EDE8F5] p-6">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#EDE8F5]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A8E2] to-[#F4A7C3] flex items-center justify-center text-white text-xs font-bold">
                      み
                    </div>
                    <span className="font-bold text-[#333]">作成されたブログ</span>
                    {loading && <Loader className="w-4 h-4 text-[#C9A8E2] animate-spin" />}
                  </div>
                  {output && !loading && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border border-[#EDE8F5] text-[#666] hover:bg-[#FAF7FD] transition-colors"
                    >
                      {copied
                        ? <><Check className="w-4 h-4 text-green-500" /><span className="text-green-500">コピーしました</span></>
                        : <><Copy className="w-4 h-4" /><span>コピー</span></>
                      }
                    </button>
                  )}
                </div>

                {output ? (
                  <div className="text-sm text-[#333] leading-loose whitespace-pre-wrap">{formatBlogText(output)}</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-[#F5F5F5] rounded animate-pulse" style={{ width: `${85 - i * 8}%` }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </>}
      </main>
    </div>
  )
}
