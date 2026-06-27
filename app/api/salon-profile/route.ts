import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data } = await supabase
    .from('salon_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return Response.json({ profile: data ?? null })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const { salon_name, salon_type, target_customer, menu, commitment, area } = body

  const { data, error } = await supabase
    .from('salon_profiles')
    .upsert({
      user_id: user.id,
      salon_name,
      salon_type,
      target_customer,
      menu,
      commitment,
      area,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return new Response(error.message, { status: 500 })
  return Response.json({ profile: data })
}
