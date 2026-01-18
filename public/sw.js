// public/sw.js
/* eslint-disable no-restricted-globals */

self.addEventListener('push', function (event) {
  // 1. Tenta ler o JSON enviado pelo Insomnia/Cron
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Gym Ignite', body: event.data.text() };
    }
  }

  // 2. Define valores padrão caso o payload venha vazio
  const title = data.title || 'Gym Ignite 🔥';
  const options = {
    body: data.body || 'A chama não pode apagar! Registre seu treino.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'treino-reminder',
    renotify: true,
    data: {
      url: data.url || '/'
    }
  };

  // 3. OBRIGATÓRIO PARA ANDROID: event.waitUntil + showNotification
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url);
    })
  );
});