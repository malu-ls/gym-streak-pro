import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const publicVapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateVapid = process.env.VAPID_PRIVATE_KEY || '';

if (publicVapid && privateVapid) {
  webpush.setVapidDetails(
    'mailto:contato@gymignite.app',
    publicVapid,
    privateVapid
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Ambiente não configurado.' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Data em formato ISO YYYY-MM-DD para o banco
  const hoje = new Date().toISOString().split('T')[0];

  try {
    // 1. Busca assinantes
    const { data: inscritos, error: errSub } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id, subscription_json');

    if (errSub || !inscritos) throw errSub;

    // 2. Busca treinos de hoje
    const { data: treinosHoje } = await supabaseAdmin
      .from('treinos')
      .select('user_id')
      .eq('data', hoje);

    const idsQueJaTreinaram = new Set(treinosHoje?.map(t => t.user_id) || []);

    // 3. Filtra quem não treinou
    const faltosos = inscritos.filter(ins => !idsQueJaTreinaram.has(ins.user_id));

    // 4. Disparo com configurações de prioridade mobile
    const promessasDeEnvio = faltosos.map(async (assinante) => {
      const payload = JSON.stringify({
        title: 'A chama está apagando! 🔥',
        body: 'Você ainda não registrou seu treino de hoje. Mantenha sua meta viva!',
        url: '/?action=open_mood_selector'
      });

      try {
        return await webpush.sendNotification(
          assinante.subscription_json as any,
          payload,
          {
            TTL: 86400, // Mantém a tentativa de entrega por 24h
            urgency: 'high', // Prioridade alta para furar o modo "Doze" do Android
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error: any) {
        // Remove assinaturas inválidas ou expiradas
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('user_id', assinante.user_id);
        }
        return null;
      }
    });

    const resultados = await Promise.all(promessasDeEnvio);
    const enviadosComSucesso = resultados.filter((r) => r !== null).length;

    return NextResponse.json({
      success: true,
      data_processamento: hoje,
      faltosos_encontrados: faltosos.length,
      notificacoes_entregues: enviadosComSucesso
    });

  } catch (error: any) {
    console.error('Erro na Cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}