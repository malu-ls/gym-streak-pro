// public/sw.js
self.addEventListener('push', function (event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-icon.png',
    vibrate: [200, 100, 200],
    tag: 'treino-reminder', // Evita múltiplas notificações acumuladas
    renotify: true,
    data: {
      // Adicionamos um parâmetro na URL para o app saber que veio da notificação
      url: data.url ? `${data.url}?action=open_mood_selector` : '/?action=open_mood_selector'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      const targetUrl = event.notification.data.url;

      // Se o app já estiver aberto, navega para a URL e foca
      for (const client of clientList) {
        if (client.url.includes(location.origin) && 'navigate' in client) {
          return client.navigate(targetUrl).then(c => c.focus());
        }
      }
      // Se estiver fechado, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});