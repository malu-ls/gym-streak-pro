// src/app/api/notifications/cron-reminders/route.ts
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

  // CORREÇÃO DE TIMEZONE: Garante que "hoje" seja a data de Brasília (YYYY-MM-DD)
  // Independente de onde o servidor da Vercel estiver rodando.
  const hoje = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).split('/').reverse().join('-');

  try {
    // 1. Busca todos os usuários inscritos para receber Push
    const { data: inscritos, error: errSub } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id, subscription_json');

    if (errSub || !inscritos) throw errSub;

    // 2. Busca treinos realizados especificamente na data "hoje" (local)
    const { data: treinosHoje, error: errTreinos } = await supabaseAdmin
      .from('treinos')
      .select('user_id')
      .eq('data', hoje);

    if (errTreinos) throw errTreinos;

    const idsQueJaTreinaram = new Set(treinosHoje?.map(t => t.user_id) || []);

    // 3. Filtra: Inscritos que NÃO estão na lista de quem treinou hoje
    const faltosos = inscritos.filter(ins => !idsQueJaTreinaram.has(ins.user_id));

    console.log(`[Cron] Data: ${hoje} | Inscritos: ${inscritos.length} | Já treinaram: ${idsQueJaTreinaram.size} | Faltosos: ${faltosos.length}`);

    // 4. Disparo das notificações
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
            TTL: 86400,
            urgency: 'high',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error: any) {
        // Limpeza de banco: Remove tokens que o Google/Apple dizem que não existem mais
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
      total_inscritos: inscritos.length,
      faltosos_encontrados: faltosos.length,
      notificacoes_enviadas: enviadosComSucesso
    });

  } catch (error: any) {
    console.error('Erro na Cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}