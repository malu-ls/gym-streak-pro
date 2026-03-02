import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // getUser é a forma mais segura de validar o usuário no servidor
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json([], { status: 401 })
  }

  const { data, error } = await supabase
    .from('treinos')
    .select('*')
    .eq('usuario_id', user.id)
    .order('data', { ascending: true })

  if (error) {
    console.error('[API Treinos GET]:', error.message)
    return NextResponse.json([], { status: 500 })
  }

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { data: dataIso, mood, hora } = await request.json()

    if (!dataIso) {
      return NextResponse.json({ error: 'Data não informada' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('treinos')
      .upsert({
        usuario_id: user.id,
        data: dataIso,
        mood: mood || '🏆',
        hora: hora ?? new Date().getHours()
      }, {
        onConflict: 'usuario_id, data' // Garante unicidade por dia/usuário
      })
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0] || { success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao salvar treino'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { data: dataIso } = await request.json()

    if (!dataIso) {
      return NextResponse.json({ error: 'Data não informada' }, { status: 400 })
    }

    const { error } = await supabase
      .from('treinos')
      .delete()
      .eq('usuario_id', user.id)
      .eq('data', dataIso)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar treino'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}