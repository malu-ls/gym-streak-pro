

/**
 * Service Worker - Gym Ignite Push System
 * Gerencia a recepção de notificações e interação do usuário
 */

// Instalação: Força o SW a se tornar ativo imediatamente
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// Ativação: Assume o controle de todas as abas abertas do app
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Evento PUSH: Recebe os dados do servidor (Vercel Cron/Push API)
self.addEventListener('push', (event) => {
  // Fallback padrão (Seguro contra erros de rede)
  let data = {
    title: 'A chama está acesa! 🔥',
    body: 'Bora registrar o treino de hoje?',
    url: '/?action=open_mood_selector'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        url: payload.url || data.url
      };
    } catch (e) {
      // Se não for JSON, tenta tratar como texto simples
      const text = event.data.text();
      if (text) data.body = text;
    }
  }

  const options = {
    body: data.body,
    // Caminhos absolutos garantem que o ícone apareça no Android/iOS
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200], // Padrão de vibração mais perceptível
    tag: 'gym-ignite-reminder', // Substitui a anterior se chegar uma nova (evita spam)
    renotify: true,
    data: {
      url: data.url
    },
    // Ações rápidas (Opcional: você pode adicionar botões no futuro)
    actions: [
      { action: 'open', title: 'REGISTRAR AGORA' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Evento CLICK: Gerencia o que acontece quando o usuário toca na notificação
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const targetUrl = new URL(notification.data.url || '/', self.location.origin).href;

  notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Verifica se já existe uma aba do app aberta
      for (const client of clientList) {
        // Se achou, foca nela e navega para a URL (caso tenha parâmetro novo)
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      // 2. Se não houver aba aberta, abre uma nova com a URL do Push
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});