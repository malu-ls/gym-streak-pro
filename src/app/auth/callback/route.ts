import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Capturamos o "next" caso você queira redirecionar para uma página específica após o login
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()

    // Transforma o código temporário em uma sessão real (JWT)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Se não houver erro, redirecionamos para o destino (dashboard ou raiz)
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Se houver erro (ex: link expirado), mandamos para uma página de erro ou login
    console.error('[Auth Callback Error]:', error.message)
    return NextResponse.json({ error: 'Falha na autenticação. O link pode ter expirado.' }, { status: 400 })
  }

  // URL de fallback caso não haja código
  return NextResponse.redirect(`${origin}`)
}