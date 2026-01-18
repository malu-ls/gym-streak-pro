import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // ESSA LINHA É A CHAVE:
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }) } catch (e) { }
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options }) } catch (e) { }
        },
      },
    }
  );

  try {
    const subscription = await req.json();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: session.user.id,
        subscription_json: subscription
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no servidor:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}