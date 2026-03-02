import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Segurança máxima: getUser() verifica o JWT no banco
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isProtectedRoute = pathname === '/' || pathname.startsWith('/dashboard')

  // REGRA 1: Proteção de Rotas (Redireciona para Login se não houver user)
  if (!user && isProtectedRoute) {
    const url = new URL('/login', request.url)
    // Opcional: salva a página que ele tentou acessar para voltar depois
    // url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // REGRA 2: Evita Login/Signup duplicado (Redireciona logado para Home)
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match todas as rotas de página, ignorando assets e APIs internas
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon-).*)',
  ],
}