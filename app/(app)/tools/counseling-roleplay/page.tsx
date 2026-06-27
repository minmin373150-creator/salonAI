'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, RotateCcw, Flag, Loader, Mic, MicOff } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Button from '@/components/ui/Button'

const SALON_TYPES = [
  'エステ', '整体・カイロ', 'ネイル', 'アイラッシュ',
  '美容室', 'リラクゼーション', 'ダイエット', 'ヨガ・ピラティス', 'その他',
]

type Message = { role: 'user' | 'assistant'; content: string }

export default function CounselingRoleplayPage() {
  // 設定
  const [salonType, setSalonType] = useState('')
  const [menu, setMenu] = useState('')
  const [customerSetting, setCustomerSetting] = useState('')

  // ロールプレイ
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // フィードバック
  const [feedback, setFeedback] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const [phase, setPhase] = useState<'setup' | 'roleplay' | 'feedback'>('setup')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<{ stop: () => void } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, feedback])

  // シナリオ文字列を構築
  const scenarioDetail = `
業種：${salonType}
メニュー：${menu || '未入力'}
お客様の設定・悩み：${customerSetting || '未入力'}
`.trim()

  // 音声入力
  function toggleListening() {
    type AnySR = {
      lang: string; continuous: boolean; interimResults: boolean
      onresult: ((e: { results: { length: number; [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
      onend: (() => void) | null
      onerror: (() => void) | null
      start: () => void; stop: () => void
    }
    const w = window as unknown as { SpeechRecognition?: new () => AnySR; webkitSpeechRecognition?: new () => AnySR }
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) { alert('このブラウザは音声入力に対応していません'); return }

    if (listening) {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setListening(false)
      return
    }

    const recognition = new SR()
    recognition.lang = 'ja-JP'
    recognition.continuous = false
    recognition.interimResults = false

    let hasResult = false
    recognition.onresult = (event) => {
      if (hasResult) return
      hasResult = true
      const text = event.results[event.results.length - 1][0].transcript
      setInput(prev => prev + text)
      recognition.stop()
    }
    recognition.onend = () => { recognitionRef.current = null; setListening(false) }
    recognition.onerror = () => { recognitionRef.current = null; setListening(false) }
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  // ロールプレイ開始（サロン側からスタート）
  function startRoleplay() {
    setMessages([])
    setFeedback('')
    setPhase('roleplay')
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  // メッセージ送信（サロン側が先に話す）
  async function sendMessage() {
    if (!input.trim() || loading) return

    // 「終了」で添削へ
    if (input.trim() === '終了') {
      setInput('')
      getFeedback()
      return
    }

    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/tools/counseling-roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'customer',
          scenario: scenarioDetail,
          messages: newMessages,
        }),
      })

      const reader = res.body?.getReader()
      if (!reader) throw new Error()
      const decoder = new TextDecoder()
      let text = ''
      const currentMessages = [...newMessages]

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setMessages([...currentMessages, { role: 'assistant', content: text }])
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' }])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  // フィードバック取得
  async function getFeedback() {
    if (messages.length < 2) return
    setFeedbackLoading(true)
    setPhase('feedback')
    setFeedback('')

    try {
      const res = await fetch('/api/tools/counseling-roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'feedback',
          scenario: scenarioDetail,
          messages,
        }),
      })

      const reader = res.body?.getReader()
      if (!reader) throw new Error()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setFeedback(text)
      }
    } catch {
      setFeedback('エラーが発生しました。')
    } finally {
      setFeedbackLoading(false)
    }
  }

  // ============ セットアップ画面 ============
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-[#FAF7FD]">
        <header className="bg-white border-b border-[#EDE8F5] px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Link href="/chat" className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E8D5F5] flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-[#9B6DC3]" />
              </div>
              <h1 className="font-bold text-[#333]">カウンセリングロールプレイ</h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-[#F4EDFD] rounded-2xl px-5 py-4 mb-6 text-sm text-[#7B4FA0]">
            <p className="font-bold mb-1">練習の流れ</p>
            <p>① 業種・メニュー・お客様設定を入力　② スタートしたら<span className="font-bold">あなたから話しかける</span>　③「終了」と入力すると時系列で添削</p>
          </div>

          <div className="flex flex-col gap-4">
            {/* 業種 */}
            <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
              <label className="text-sm font-bold text-[#333] mb-3 block">
                業種を選んでください <span className="text-[#E86A9A]">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SALON_TYPES.map(type => (
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

            {/* メニュー */}
            <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
              <label className="text-sm font-bold text-[#333] mb-1 block">
                今日の練習メニュー
              </label>
              <p className="text-xs text-[#999] mb-3">例：初回体験フェイシャル60分 / 骨盤矯正コース / ジェルネイルオフ込みワンカラー</p>
              <textarea
                value={menu}
                onChange={e => setMenu(e.target.value)}
                placeholder="例：耳つぼ×痩身体験コース 90分 ¥3,980"
                rows={3}
                className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-none"
              />
            </div>

            {/* お客様設定 */}
            <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
              <label className="text-sm font-bold text-[#333] mb-1 block">
                お客様の設定・悩み
              </label>
              <p className="text-xs text-[#999] mb-3">具体的に書くほどリアルな練習になります</p>
              <textarea
                value={customerSetting}
                onChange={e => setCustomerSetting(e.target.value)}
                placeholder="例：40代女性。産後から体重が戻らず、ダイエットを何度か試みたがリバウンド繰り返し。耳つぼは半信半疑。価格が高いと継続できないと思っている。過去にエステで強引に勧誘されたことがある。"
                rows={5}
                className="w-full rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] focus:border-transparent resize-none leading-relaxed"
              />
            </div>

            <Button
              type="button"
              onClick={startRoleplay}
              disabled={!salonType}
              size="lg"
              className="w-full"
            >
              ロールプレイをスタート
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // ============ ロールプレイ画面 ============
  if (phase === 'roleplay') {
    return (
      <div className="min-h-screen bg-[#FAF7FD] flex flex-col">
        <header className="bg-white border-b border-[#EDE8F5] px-4 py-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setPhase('setup')} className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <p className="font-bold text-sm text-[#333]">{salonType} ロールプレイ</p>
                <p className="text-xs text-[#999]">あなたから話しかけてください</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setMessages([]); setPhase('roleplay') }}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-[#EDE8F5] text-[#666] hover:bg-[#FAF7FD] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                やり直す
              </button>
              <button
                onClick={getFeedback}
                disabled={messages.length < 2}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-[#C9A8E2] text-white hover:bg-[#B894D4] transition-colors disabled:opacity-40"
              >
                <Flag className="w-3 h-3" />
                終了して添削
              </button>
            </div>
          </div>
        </header>

        {/* お客様情報 */}
        <div className="bg-[#FEF9FF] border-b border-[#EDE8F5] px-4 py-2 flex-shrink-0">
          <p className="max-w-2xl mx-auto text-xs text-[#9B6DC3] line-clamp-1">
            👤 {customerSetting || `${salonType}の初来店のお客様`}
          </p>
        </div>

        {/* チャット */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">

            {/* 最初のガイド */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[#999] mb-2">お客様が来店しました</p>
                <p className="text-sm font-bold text-[#9B6DC3]">あなたから話しかけてみてください！</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#F4A7C3] flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                    客
                  </div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#C9A8E2] text-white rounded-tr-sm'
                    : 'bg-white border border-[#EDE8F5] text-[#333] rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-[#C9A8E2] flex items-center justify-center text-white text-xs font-bold ml-2 flex-shrink-0 mt-1">
                    私
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-[#F4A7C3] flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
                  客
                </div>
                <div className="bg-white border border-[#EDE8F5] rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader className="w-4 h-4 text-[#C9A8E2] animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* 入力欄 */}
        <div className="bg-white border-t border-[#EDE8F5] px-4 py-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder='施術者として話しかけてください（「終了」と入力→添削開始）'
                rows={2}
                className="flex-1 rounded-xl border border-[#EDE8F5] px-4 py-3 text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#C9A8E2] resize-none"
              />
              {/* 音声入力ボタン */}
              <button
                onClick={toggleListening}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                  listening
                    ? 'bg-[#F4A7C3] text-white animate-pulse'
                    : 'border border-[#EDE8F5] text-[#999] hover:bg-[#FAF7FD]'
                }`}
                title={listening ? '音声入力を停止' : '音声で入力'}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              {/* 送信ボタン */}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-[#C9A8E2] text-white flex items-center justify-center hover:bg-[#B894D4] transition-colors disabled:opacity-40 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#bbb] mt-1.5 text-right">送信はボタンを押してください</p>
          </div>
        </div>
      </div>
    )
  }

  // SCORE行・TOTAL行・総合評価セクションをパースして抽出
  function parseFeedback(text: string) {
    const scores: { label: string; max: number; score: number }[] = []
    let total = 0
    let summary = ''

    const lines = text.split('\n')
    let inScoreSection = false
    let afterTotal = false
    const cleanLines: string[] = []

    for (const line of lines) {
      // SCOREパース
      const scoreMatch = line.match(/^SCORE:\s*(.+?)\s*\/\s*(\d+)\s*\/\s*(\d+)/)
      if (scoreMatch) {
        scores.push({ label: scoreMatch[1], max: parseInt(scoreMatch[2]), score: parseInt(scoreMatch[3]) })
        continue
      }
      // TOTALパース
      const totalMatch = line.match(/^TOTAL:\s*(\d+)/)
      if (totalMatch) {
        total = parseInt(totalMatch[1])
        afterTotal = true
        continue
      }
      // 総合評価セクション見出しをスキップ
      if (line.match(/^##\s*📊\s*総合評価/)) {
        inScoreSection = true
        continue
      }
      // 総合評価セクション内の「一言総評」を抽出
      if (inScoreSection) {
        if (line.startsWith('**一言総評：**')) {
          summary = line.replace('**一言総評：**', '').trim()
          continue
        }
        // 次のセクション（##）が来たらscoreセクション終了
        if (line.startsWith('## ') && !line.match(/^##\s*📊/)) {
          inScoreSection = false
          cleanLines.push(line)
        }
        // テーブル行・空行はスキップ
        continue
      }
      cleanLines.push(line)
    }

    return { scores, total, summary, cleanedFeedback: cleanLines.join('\n') }
  }

  const { scores, total, summary, cleanedFeedback } = parseFeedback(feedback)

  // スコアの色
  function scoreColor(score: number, max: number) {
    const pct = score / max
    if (pct >= 0.8) return '#7BC97A'
    if (pct >= 0.5) return '#F4A7C3'
    return '#E86A6A'
  }

  // ============ フィードバック画面 ============
  return (
    <div className="min-h-screen bg-[#FAF7FD]">
      <header className="bg-white border-b border-[#EDE8F5] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setPhase('roleplay')} className="p-2 rounded-xl text-[#999] hover:bg-[#FAF7FD] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A8E2] to-[#F4A7C3] flex items-center justify-center text-white text-xs font-bold">
                み
              </div>
              <span className="font-bold text-[#333]">みなみからのフィードバック</span>
            </div>
          </div>
          <button
            onClick={() => { setPhase('setup'); setMessages([]); setFeedback('') }}
            className="text-xs px-3 py-1.5 rounded-xl border border-[#EDE8F5] text-[#666] hover:bg-[#FAF7FD] transition-colors"
          >
            もう一度練習する
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">

        {/* 会話の振り返り */}
        <div className="bg-white rounded-2xl border border-[#EDE8F5] p-5">
          <p className="text-xs font-bold text-[#999] mb-3">カウンセリングの記録</p>
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className={`font-bold flex-shrink-0 ${m.role === 'user' ? 'text-[#9B6DC3]' : 'text-[#E86A9A]'}`}>
                  {m.role === 'user' ? '施術者：' : 'お客様：'}
                </span>
                <span className="text-[#555] leading-relaxed">{m.content}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ローディング */}
        {feedbackLoading && !feedback && (
          <div className="bg-white rounded-2xl border border-[#EDE8F5] p-6 flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-[#F5F5F5] rounded animate-pulse" style={{ width: `${80 - i * 8}%` }} />
            ))}
          </div>
        )}

        {feedback && (
          <>
            {/* スコアグラフ */}
            {scores.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#EDE8F5] p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-[#333] text-base">📊 総合評価</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold" style={{ color: scoreColor(total, 100) }}>{total}</span>
                    <span className="text-sm text-[#999]">/ 100点</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {scores.map((s, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#555]">{s.label}</span>
                        <span className="text-xs font-bold" style={{ color: scoreColor(s.score, s.max) }}>
                          {s.score} / {s.max}点
                        </span>
                      </div>
                      <div className="h-2 bg-[#F0EBF8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(s.score / s.max) * 100}%`,
                            backgroundColor: scoreColor(s.score, s.max),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {summary && (
                  <div className="mt-5 pt-4 border-t border-[#EDE8F5]">
                    <p className="text-xs font-bold text-[#999] mb-1">一言総評</p>
                    <p className="text-sm text-[#444] leading-relaxed">{summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* フィードバック本文 */}
            <div className="bg-white rounded-2xl border border-[#EDE8F5] p-6">
              <div className="feedback-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2({ children }) {
                      return (
                        <div className="flex items-center gap-3 mt-8 mb-5 pb-3 border-b-2 border-[#C9A8E2]">
                          <span className="text-lg font-bold text-[#333]">{children}</span>
                        </div>
                      )
                    },
                    h3({ children }) {
                      const text = String(children)
                      return (
                        <div className="bg-[#FAF7FD] border-l-4 border-[#C9A8E2] rounded-r-xl px-4 py-3 mt-6 mb-3">
                          <span className="font-bold text-[#7B4FA0] text-sm">{text}</span>
                        </div>
                      )
                    },
                    p({ children }) {
                      const text = String(children)
                      if (text.startsWith('【お客様心理】')) {
                        return (
                          <div className="flex gap-2 my-2">
                            <span className="text-xs font-bold text-[#F4A7C3] bg-[#FEF0F5] px-2 py-0.5 rounded-lg flex-shrink-0 h-fit">お客様心理</span>
                            <p className="text-sm text-[#555] leading-relaxed">{text.replace('【お客様心理】', '')}</p>
                          </div>
                        )
                      }
                      if (text.startsWith('【聞くべき質問】')) {
                        return (
                          <div className="flex gap-2 my-2">
                            <span className="text-xs font-bold text-[#9B6DC3] bg-[#F4EDFD] px-2 py-0.5 rounded-lg flex-shrink-0 h-fit">聞くべき質問</span>
                            <p className="text-sm text-[#555] leading-relaxed">{text.replace('【聞くべき質問】', '')}</p>
                          </div>
                        )
                      }
                      if (text.startsWith('【言い換え例】')) {
                        return (
                          <div className="flex gap-2 my-2">
                            <span className="text-xs font-bold text-[#7BC97A] bg-[#F0FAF0] px-2 py-0.5 rounded-lg flex-shrink-0 h-fit">言い換え例</span>
                            <p className="text-sm text-[#555] leading-relaxed">{text.replace('【言い換え例】', '')}</p>
                          </div>
                        )
                      }
                      if (text.startsWith('NG：') || text.startsWith('OK：')) {
                        const isNG = text.startsWith('NG：')
                        return (
                          <div className={`text-sm px-3 py-2 rounded-xl my-1 ${isNG ? 'bg-[#FEF0F0] text-[#D05050]' : 'bg-[#F0FAF0] text-[#3A8A3A]'}`}>
                            <span className="font-bold">{isNG ? '❌ NG：' : '✅ OK：'}</span>
                            {text.replace(/^(NG：|OK：)/, '')}
                          </div>
                        )
                      }
                      return <p className="text-sm text-[#444] leading-relaxed my-2">{children}</p>
                    },
                    ul({ children }) {
                      return <ul className="my-3 flex flex-col gap-2">{children}</ul>
                    },
                    li({ children }) {
                      return (
                        <li className="flex gap-2 text-sm text-[#444] leading-relaxed">
                          <span className="text-[#C9A8E2] flex-shrink-0 mt-0.5">•</span>
                          <span>{children}</span>
                        </li>
                      )
                    },
                    strong({ children }) {
                      return <strong className="text-[#9B6DC3] font-bold">{children}</strong>
                    },
                    hr() {
                      return <hr className="my-6 border-[#EDE8F5]" />
                    },
                    blockquote({ children }) {
                      return (
                        <div className="border-l-4 border-[#F4A7C3] bg-[#FEF9FF] rounded-r-xl px-4 py-3 my-3 text-sm text-[#555]">
                          {children}
                        </div>
                      )
                    },
                  }}
                >
                  {cleanedFeedback}
                </ReactMarkdown>
              </div>
            </div>
          </>
        )}

        {feedbackLoading && feedback && (
          <div className="flex items-center gap-2 text-sm text-[#999] px-2">
            <Loader className="w-4 h-4 animate-spin text-[#C9A8E2]" />
            分析中...
          </div>
        )}

        <div ref={bottomRef} />
      </main>
    </div>
  )
}
