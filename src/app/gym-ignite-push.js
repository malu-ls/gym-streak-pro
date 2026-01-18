/* eslint-disable no-restricted-globals */

// Força o Service Worker a assumir o controle imediatamente após a instalação
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Escutador de eventos Push
self.addEventListener('push', function (event) {
  // Fallback seguro caso o payload venha vazio ou inválido
  let data = {
    title: 'Gym Ignite 🔥',
    body: 'Bora treinar? A chama não pode apagar!',
    url: '/'
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
      // Se não for JSON, tenta ler como texto simples
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png', // Verifique se este arquivo existe na pasta public
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'gym-ignite-notif', // Tag única para agrupar notificações
    renotify: true,
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gerenciamento do clique na notificação
self.addEventListener('notificationclick', function (event) {
  const notification = event.notification;
  const targetUrl = notification.data.url || '/';

  notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se o app já estiver aberto, foca na aba existente
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abre uma nova janela/aba
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});