import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'サロンAI | 美容サロン専門AIコンサル',
  description: '美容サロンオーナーのための24時間AIコンサル。集客・リピート・接客・カウンセリングの悩みをすぐに解決。',
  keywords: '美容サロン,集客,リピート,AI,コンサル,エステ,ネイル,整体',
  openGraph: {
    title: 'サロンAI | 美容サロン専門AIコンサル',
    description: '美容サロンオーナーのための24時間AIコンサル',
    type: 'website',
    locale: 'ja_JP',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${notoSansJP.className} min-h-full flex flex-col antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'inherit',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#C9A8E2',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
