import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error: dbError } = await supabase
    .from('tool_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json({ history: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { tool_name, input_summary, output } = await req.json()

  const { error: dbError } = await supabase
    .from('tool_history')
    .insert({ user_id: user.id, tool_name, input_summary, output })

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json({ success: true })
}
