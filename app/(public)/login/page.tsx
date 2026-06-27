'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Logo from '@/components/ui/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('メールアドレスまたはパスワードが間違っています')
      setLoading(false)
      return
    }

    router.push('/chat')
    router.refresh()
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
          <h1 className="text-xl font-bold text-center text-[#333] mb-6">
            ログイン
          </h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              label="パスワード"
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
              ログイン
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#666]">
            アカウントをお持ちでない方は{' '}
            <Link href="/register" className="text-[#C9A8E2] font-medium hover:underline">
              新規登録
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-[#999] hover:text-[#666]">
            ← トップページへ戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
