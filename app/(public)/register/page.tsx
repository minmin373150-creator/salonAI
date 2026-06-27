'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Logo from '@/components/ui/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('パスワードは8文字以上で設定してください')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('このメールアドレスはすでに登録されています')
      } else {
        toast.error('登録に失敗しました。もう一度お試しください')
      }
      setLoading(false)
      return
    }

    router.push('/register/verify')
  }

  return (
    <div className="min-h-screen bg-[#FAF7FD] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#EDE8F5] p-8">
          <h1 className="text-xl font-bold text-center text-[#333] mb-2">
            新規会員登録
          </h1>
          <p className="text-sm text-center text-[#999] mb-6">
            月額5,500円（税込）
          </p>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input
              id="name"
              label="お名前"
              type="text"
              placeholder="山田 花子"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              id="email"
              label="メールアドレス"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              id="password"
              label="パスワード（8文字以上）"
              type="password"
              placeholder="パスワードを設定"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />

            <p className="text-xs text-[#999] leading-relaxed">
              登録すると
              <Link href="/terms" className="text-[#C9A8E2] hover:underline mx-1">利用規約</Link>
              および
              <Link href="/privacy" className="text-[#C9A8E2] hover:underline mx-1">プライバシーポリシー</Link>
              に同意したものとみなします。
            </p>

            <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
              登録する（無料で始める）
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#666]">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-[#C9A8E2] font-medium hover:underline">
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
