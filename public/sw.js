// public/sw.js
/* eslint-disable no-restricted-globals */

self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || 'Bora bater a meta de hoje? 🔥',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'treino-reminder',
      renotify: true,
      requireInteraction: true, // Mantém a notificação visível até o usuário interagir
      data: {
        url: data.url || '/?action=open_mood_selector'
      }
    };

    // IMPORTANTE: event.waitUntil deve envolver a promessa de mostrar a notificação
    event.waitUntil(
      self.registration.showNotification(data.title || 'GYM IGNITE', options)
    );
  } catch (err) {
    console.error('Erro ao processar push notification:', err);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // 1. Tentar encontrar uma aba já aberta do Ignite
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.navigate(targetUrl).then(c => c.focus());
        }
      }

      // 2. Se não houver aba aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});