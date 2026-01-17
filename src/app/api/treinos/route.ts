import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// BUSCAR TREINOS
export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json([], { status: 401 })
  }

  const { data, error } = await supabase
    .from('treinos')
    .select('*')
    .eq('usuario_id', session.user.id)
    .order('data', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data || [])
}

// SALVAR OU REMOVER TREINO (TOGGLE)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: dataIso, hora } = await request.json()

  // 1. Verificar se o treino já existe para este usuário neste dia
  const { data: existente } = await supabase
    .from('treinos')
    .select('id')
    .eq('usuario_id', session.user.id)
    .eq('data', dataIso)
    .single()

  if (existente) {
    // 2. Se existe, nós deletamos (Toggle Off)
    const { error: deleteError } = await supabase
      .from('treinos')
      .delete()
      .eq('id', existente.id)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'removed' })
  } else {
    // 3. Se não existe, nós inserimos (Toggle On)
    const { error: insertError } = await supabase
      .from('treinos')
      .insert([{
        usuario_id: session.user.id,
        data: dataIso,
        hora: hora || new Date().getHours()
      }])

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'inserted' })
  }
}