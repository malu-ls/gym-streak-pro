import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { NextResponse } from 'next/server';

// 1. Força a rota a ser dinâmica para evitar erro de 'supabaseKey is required' no build da Vercel
export const dynamic = 'force-dynamic';

// Inicialização segura do WebPush
const publicVapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateVapid = process.env.VAPID_PRIVATE_KEY || '';

if (publicVapid && privateVapid) {
  webpush.setVapidDetails(
    'mailto:contato@gymignite.app',
    publicVapid,
    privateVapid
  );
}

// 2. Inicialização segura do Cliente Admin
// Durante o build, essas variáveis podem estar vazias. O 'force-dynamic' impede que o build quebre aqui.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(req: Request) {
  // Verificação de inicialização
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Ambiente não configurado corretamente.' }, { status: 500 });
  }

  // 3. Segurança: Proteção da Rota via Bearer Token
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Data local do servidor (YYYY-MM-DD)
  const hoje = new Date().toLocaleDateString('en-CA');

  try {
    // 4. Busca todos os assinantes de notificação
    const { data: inscritos, error: errSub } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id, subscription_json');

    if (errSub || !inscritos) throw errSub;

    // 5. Busca IDs de quem já treinou hoje de forma otimizada (Batch)
    const { data: treinosHoje } = await supabaseAdmin
      .from('treinos')
      .select('user_id')
      .eq('data', hoje);

    const idsQueJaTreinaram = new Set(treinosHoje?.map(t => t.user_id) || []);

    // 6. Filtra apenas os faltosos (quem está inscrito mas não treinou hoje)
    const faltosos = inscritos.filter(ins => !idsQueJaTreinaram.has(ins.user_id));

    // 7. Disparo em massa (Paralelizado)
    const promessasDeEnvio = faltosos.map(async (assinante) => {
      const payload = JSON.stringify({
        title: 'A chama está apagando! 🔥',
        body: 'Você ainda não registrou seu treino de hoje. Mantenha sua meta viva!',
        url: '/' // O sw.js tratará o ?action=open_mood_selector automaticamente
      });

      try {
        return await webpush.sendNotification(
          assinante.subscription_json as any,
          payload
        );
      } catch (error: any) {
        // Limpeza de tokens inválidos (410: Gone / 404: Not Found)
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
    const enviadosComSucesso = resultados.filter((r: any) => r !== null).length;

    return NextResponse.json({
      success: true,
      total_assinantes: inscritos.length,
      faltosos_notificados: enviadosComSucesso,
      data: hoje
    });

  } catch (error: any) {
    console.error('Erro na Cron de Notificações:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}