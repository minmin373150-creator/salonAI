import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/isAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()

  // auth.usersは直接取れないのでtool_historyとsalon_profilesから集計
  const { data: profiles } = await supabase
    .from('salon_profiles')
    .select('user_id, salon_name, salon_type, created_at')
    .order('created_at', { ascending: false })

  const { data: historyStats } = await supabase
    .from('tool_history')
    .select('user_id, tool_name, created_at')
    .order('created_at', { ascending: false })

  // ユーザーごとの使用回数を集計
  const userStats: Record<string, { count: number; lastUsed: string; tools: string[] }> = {}
  for (const h of historyStats || []) {
    if (!userStats[h.user_id]) userStats[h.user_id] = { count: 0, lastUsed: h.created_at, tools: [] }
    userStats[h.user_id].count++
    if (!userStats[h.user_id].tools.includes(h.tool_name)) userStats[h.user_id].tools.push(h.tool_name)
  }

  return Response.json({ profiles, userStats })
}
