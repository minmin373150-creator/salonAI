import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/isAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await createClient()
  const { data } = await supabase.from('admins').select('*').order('created_at')
  return Response.json({ admins: data })
}

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await createClient()
  const { email } = await req.json()
  if (!email) return Response.json({ error: 'メールアドレスが必要です' }, { status: 400 })

  // auth.usersからuser_idを取得
  const { data: userData } = await supabase
    .from('salon_profiles')
    .select('user_id')
    .eq('user_id', email) // emailでは検索できないのでRPC使用
    .single()

  // Supabase AdminAPIでユーザー検索（service roleが必要）
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: { users } } = await adminClient.auth.admin.listUsers()
  const target = users.find(u => u.email === email)
  if (!target) return Response.json({ error: 'ユーザーが見つかりません。先にサインアップが必要です。' }, { status: 404 })

  const { error } = await supabase.from('admins').insert({ user_id: target.id, email })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await createClient()
  const { id } = await req.json()
  await supabase.from('admins').delete().eq('id', id)
  return Response.json({ success: true })
}
