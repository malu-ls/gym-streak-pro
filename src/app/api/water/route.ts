import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Usamos Service Role aqui para garantir que a Cron ou widgets PWA consigam acessar
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper para pegar a data de Brasília formatada
const getHojeBrasilia = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
}).format(new Date());

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const hoje = getHojeBrasilia();

    // Busca o consumo de hoje e o último peso registrado
    const [waterResponse, weightResponse] = await Promise.all([
      supabaseAdmin
        .from('water_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', hoje)
        .maybeSingle(), // Usamos maybeSingle para não disparar erro se não existir registro
      supabaseAdmin
        .from('historico_peso')
        .select('peso')
        .eq('usuario_id', userId)
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    // Cálculo da meta: 35ml por kg. Default 2450ml (70kg)
    const pesoReferencia = weightResponse.data?.peso || 70;
    const metaCalculada = Math.round(pesoReferencia * 35);

    return NextResponse.json({
      data: {
        consumido: waterResponse.data?.consumed_ml || 0,
        meta: waterResponse.data?.goal_ml || metaCalculada,
        peso_base: pesoReferencia,
        data_referencia: hoje
      }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Water API GET Error]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, consumedMl, goalMl } = await req.json();

    if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });

    const hoje = getHojeBrasilia();

    // Upsert: Se já existe registro para hoje, atualiza. Se não, cria.
    const { data, error } = await supabaseAdmin
      .from('water_logs')
      .upsert({
        user_id: userId,
        date: hoje,
        consumed_ml: consumedMl,
        goal_ml: goalMl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, date'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar água';
    console.error('[Water API POST Error]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}