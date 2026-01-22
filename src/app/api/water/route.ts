import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Pega a data de Brasília para a consulta
    const hoje = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
    }).format(new Date());

    // Busca o log de água e o peso mais recente simultaneamente
    const [waterResponse, weightResponse] = await Promise.all([
      supabaseAdmin
        .from('water_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', hoje)
        .single(),
      supabaseAdmin
        .from('historico_peso')
        .select('peso')
        .eq('usuario_id', userId)
        .order('data', { ascending: false })
        .limit(1)
        .single()
    ]);

    const metaBase = weightResponse.data?.peso || 70;
    const metaCalculada = Math.round(metaBase * 35);

    return NextResponse.json({
      data: {
        consumido: waterResponse.data?.consumed_ml || 0,
        meta: waterResponse.data?.goal_ml || metaCalculada,
        peso_base: metaBase,
        data_referencia: hoje
      }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na API de Água:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}