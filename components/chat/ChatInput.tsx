'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  onSend: (message: string) => void
  onFileSelect?: (files: FileList) => void
  disabled?: boolean
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition
    webkitSpeechRecognition?: new () => ISpeechRecognition
  }
}

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

interface ISpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}

export default function ChatInput({ onSend, onFileSelect, disabled }: Props) {
  const [value, setValue] = useState('')
  const [listening, setListening] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function toggleVoice() {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      alert('お使いのブラウザは音声入力に対応していません。Chrome/Safariをお使いください。')
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'ja-JP'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setValue((prev) => prev + transcript)
    }

    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <div className="flex items-end gap-2 bg-white border border-[#EDE8F5] rounded-2xl px-3 py-2 shadow-sm">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="flex-shrink-0 p-2 rounded-xl text-[#999] hover:text-[#C9A8E2] hover:bg-[#FAF7FD] transition-colors disabled:opacity-40"
        title="ファイルを添付"
      >
        <Paperclip className="w-5 h-5" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onFileSelect?.(e.target.files)}
      />

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="何でも相談してください（Shift+Enterで改行）"
        rows={1}
        className={cn(
          'flex-1 resize-none bg-transparent text-[#333] placeholder-[#bbb] outline-none text-sm leading-relaxed py-1',
          'max-h-40 overflow-y-auto custom-scrollbar'
        )}
      />

      <button
        type="button"
        onClick={toggleVoice}
        disabled={disabled}
        className={cn(
          'flex-shrink-0 p-2 rounded-xl transition-colors disabled:opacity-40',
          listening
            ? 'text-white bg-[#F4A7C3] hover:bg-[#e897b5]'
            : 'text-[#999] hover:text-[#C9A8E2] hover:bg-[#FAF7FD]'
        )}
        title={listening ? '音声入力を停止' : '音声で入力'}
      >
        {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="flex-shrink-0 p-2 rounded-xl bg-[#C9A8E2] text-white hover:bg-[#B894D4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="送信（Enter）"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  )
}
