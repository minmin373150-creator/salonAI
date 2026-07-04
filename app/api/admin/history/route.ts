import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/isAdmin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const userId = req.nextUrl.searchParams.get('user_id')

  let query = supabase
    .from('tool_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (userId) query = query.eq('user_id', userId)

  const { data } = await query
  return Response.json({ history: data })
}
