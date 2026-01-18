/* eslint-disable no-restricted-globals */

// 1. Integração com o Workbox (gerado pelo next-pwa)
// Isso evita que o PWA pare de funcionar offline
if (typeof importScripts === 'function') {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');
}

self.addEventListener('push', function (event) {
  // Tenta processar os dados vindos do servidor
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Gym Ignite 🔥',
        body: event.data.text() || 'Bora bater a meta de hoje?'
      };
    }
  }

  // Define os valores finais com fallbacks de segurança
  const title = data.title || 'Gym Ignite 🔥';
  const options = {
    body: data.body || 'A chama não pode apagar! Registre seu treino.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'treino-reminder', // Evita múltiplas notificações iguais
    renotify: true,
    data: {
      url: data.url || '/'
    }
  };

  // OBRIGATÓRIO: Avisar ao navegador para manter o SW vivo até mostrar a notificação
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // Lógica para focar na aba existente ou abrir uma nova
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      const targetUrl = event.notification.data.url || '/';

      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});