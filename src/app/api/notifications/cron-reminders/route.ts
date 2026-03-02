import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Configuração de Web Push
const publicVapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateVapid = process.env.VAPID_PRIVATE_KEY || '';

if (publicVapid && privateVapid) {
  webpush.setVapidDetails(
    'mailto:contato@gymignite.app',
    publicVapid,
    privateVapid
  );
}

// Configuração do Supabase Admin (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuração de Admin ausente.' }, { status: 500 });
  }

  // Validação de segurança da Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CORREÇÃO DE TIMEZONE: Garante YYYY-MM-DD no horário de Brasília
  const hoje = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).split('/').reverse().join('-');

  try {
    // 1. Busca usuários inscritos
    const { data: inscritos, error: errSub } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id, subscription_json');

    if (errSub || !inscritos) throw errSub;

    // 2. Busca quem já treinou hoje no banco (usando a data local formatada)
    const { data: treinosHoje, error: errTreinos } = await supabaseAdmin
      .from('treinos')
      .select('usuario_id')
      .eq('data', hoje);

    if (errTreinos) throw errTreinos;

    // Criamos um Set para busca rápida (O(1))
    const idsQueJaTreinaram = new Set(treinosHoje?.map(t => t.usuario_id) || []);

    // 3. Filtra quem ainda não registrou treino
    const faltosos = inscritos.filter(ins => !idsQueJaTreinaram.has(ins.user_id));

    // 4. Disparo paralelo das notificações
    const promessasDeEnvio = faltosos.map(async (assinante) => {
      const payload = JSON.stringify({
        title: 'A chama está apagando! 🔥',
        body: 'Você ainda não registrou seu treino de hoje. Mantenha sua meta viva!',
        url: '/?action=open_mood_selector' // Deep link para abrir o seletor de humor
      });

      try {
        const sub = assinante.subscription_json as unknown as webpush.PushSubscription;
        return await webpush.sendNotification(sub, payload);
      } catch (error: any) {
        // Limpeza automática: Se o token expirou (410) ou é inválido (404), removemos do banco
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
      meta: {
        data_local: hoje,
        faltosos: faltosos.length,
        enviados: enviadosComSucesso
      }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno na Cron';
    console.error('[Cron Error]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}