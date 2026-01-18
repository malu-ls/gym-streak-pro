import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { NextResponse } from 'next/server';

// Configuração centralizada
webpush.setVapidDetails(
  'mailto:contato@gymignite.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // 1. Segurança: Proteção da Rota
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hoje = new Date().toLocaleDateString('en-CA');

  try {
    // 2. BUSCA OTIMIZADA:
    // Pegamos assinantes e, na mesma query, verificamos se há treino hoje usando Left Join
    // Nota: Esta query assume que você tem uma relação no banco.
    // Caso contrário, faremos a filtragem manual de forma eficiente.
    const { data: inscritos, error: errSub } = await supabaseAdmin
      .from('push_subscriptions')
      .select(`
        user_id,
        subscription_json
      `);

    if (errSub || !inscritos) throw errSub;

    // 3. Pegar IDs de quem JÁ TREINOU hoje para filtrar
    const { data: treinosHoje } = await supabaseAdmin
      .from('treinos')
      .select('user_id')
      .eq('data', hoje);

    const idsQueJaTreinaram = new Set(treinosHoje?.map(t => t.user_id) || []);

    // 4. Filtrar apenas quem ainda não treinou
    const faltosos = inscritos.filter(ins => !idsQueJaTreinaram.has(ins.user_id));

    const promessasDeEnvio = faltosos.map(async (assinante) => {
      const payload = JSON.stringify({
        title: 'A chama está apagando! 🔥',
        body: 'Você ainda não registrou seu treino de hoje. Mantenha sua meta viva!',
        url: '/' // O sw.js tratará o ?action=open_mood_selector
      });

      try {
        return await webpush.sendNotification(
          assinante.subscription_json as any,
          payload
        );
      } catch (error: any) {
        // 5. LIMPEZA: Se o token expirou (410 Gone ou 404), removemos do banco
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
    const enviadosComSucesso = resultados.filter(r => r !== null).length;

    return NextResponse.json({
      success: true,
      total_assinantes: inscritos.length,
      faltosos_notificados: enviadosComSucesso
    });

  } catch (error: any) {
    console.error('Erro na Cron de Notificações:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}