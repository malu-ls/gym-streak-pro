import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const cookieStore = await cookies();

  // Cliente Supabase configurado para Server Side Rendering
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
            // Silencioso: Route Handlers nem sempre permitem setar cookies em tempo de execução
          }
        },
      },
    }
  );

  try {
    const subscription = await req.json();

    // 1. Validação do Payload do Browser
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Inscrição Push inválida' }, { status: 400 });
    }

    // 2. Validação Segura do Usuário (Server-side check)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[Subscribe Auth Error]:", authError?.message);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 3. Upsert: Salva ou atualiza a inscrição para este usuário
    // Usamos o user_id como chave de conflito para que cada usuário tenha apenas 1 token ativo
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          subscription_json: subscription,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      );

    if (dbError) {
      console.error("[Subscribe DB Error]:", dbError.message);
      return NextResponse.json({ error: 'Erro ao salvar no banco' }, { status: 403 });
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno desconhecido';
    console.error("[Subscribe Critical Error]:", message);
    return NextResponse.json(
      { error: 'Erro ao processar sua inscrição' },
      { status: 500 }
    );
  }
}