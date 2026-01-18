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
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }) } catch { /* Ignore */ }
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options }) } catch { /* Ignore */ }
        },
      },
    }
  );

  try {
    const subscription = await req.json();

    // SEGURANÇA: Usamos getUser() em vez de getSession() para validar a autenticidade
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Upsert na tabela
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription_json: subscription,
        updated_at: new Date().toISOString() // Agora a coluna existirá após o SQL acima
      }, { onConflict: 'user_id' });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no Subscribe:", error.message);
    return NextResponse.json({ error: 'Erro ao processar inscrição' }, { status: 500 });
  }
}