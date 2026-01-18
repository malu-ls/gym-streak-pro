import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // O Next.js pode lançar erro se os cookies forem alterados em Server Action/Route Handler
          }
        },
      },
    }
  );

  try {
    const subscription = await req.json();

    // 1. Validação básica do payload antes de tocar no banco
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Inscrição inválida' }, { status: 400 });
    }

    // 2. getUser() é a forma segura de validar o JWT no servidor
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Erro Auth:", authError?.message);
      return NextResponse.json({ error: 'Sessão expirada ou inválida' }, { status: 401 });
    }

    // 3. Upsert com tratamento de erro detalhado
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          subscription_json: subscription,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      );

    if (dbError) {
      console.error("Erro Supabase RLS/DB:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 403 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro Crítico no Servidor:", error.message);
    return NextResponse.json(
      { error: 'Erro interno ao processar inscrição' },
      { status: 500 }
    );
  }
}