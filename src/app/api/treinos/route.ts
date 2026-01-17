import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json([], { status: 401 })

  const { data } = await supabase
    .from('treinos')
    .select('*')
    .eq('usuario_id', session.user.id)
    .order('data', { ascending: true })

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: dataIso, mood, hora } = await request.json()

  const { data, error } = await supabase
    .from('treinos')
    .upsert({
      usuario_id: session.user.id,
      data: dataIso,
      mood: mood || '🏆',
      hora: hora || new Date().getHours()
    })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: dataIso } = await request.json()

  const { error } = await supabase
    .from('treinos')
    .delete()
    .eq('usuario_id', session.user.id)
    .eq('data', dataIso)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}