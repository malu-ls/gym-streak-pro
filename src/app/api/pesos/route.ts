import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Função auxiliar para criar o cliente Supabase no servidor de forma padronizada
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
            // Silencioso: Route Handlers nem sempre permitem setar cookies em POST
          }
        },
      },
    }
  );
}

export async function POST(request: Request) {
  const supabase = await getSupabaseClient();

  // getUser() é mais seguro que getSession() para operações de escrita
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { peso } = await request.json();

    if (!peso) {
      return NextResponse.json({ error: 'Peso não informado' }, { status: 400 });
    }

    const { error } = await supabase
      .from('historico_peso')
      .insert({
        usuario_id: user.id,
        peso: parseFloat(peso),
        data: new Date().toISOString()
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao salvar peso';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await getSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('historico_peso')
    .select('*')
    .eq('usuario_id', user.id) // Garantia extra de isolamento de dados
    .order('data', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}