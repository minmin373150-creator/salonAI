import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import { Mail } from 'lucide-react'

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-[#FAF7FD] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#EDE8F5] p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#E8D5F5] rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#C9A8E2]" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-[#333] mb-3">
            確認メールを送りました
          </h1>
          <p className="text-sm text-[#666] leading-relaxed">
            ご登録のメールアドレスに確認メールをお送りしました。
            メール内のリンクをクリックして、登録を完了してください。
          </p>
          <p className="text-xs text-[#999] mt-4">
            メールが届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
        </div>

        <div className="mt-6">
          <Link href="/login" className="text-sm text-[#C9A8E2] hover:underline">
            ログインページへ
          </Link>
        </div>
      </div>
    </div>
  )
}
