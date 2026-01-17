import { createClient } from '@/utils/supabase/server' // ou de onde você importa o helper
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    // ADICIONE O AWAIT AQUI
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL para onde o usuário será redirecionado após o login
  return NextResponse.redirect(`${origin}/dashboard`)
}