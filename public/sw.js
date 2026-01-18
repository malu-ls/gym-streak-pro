// public/sw.js
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Bora treinar?',
      // Use caminhos absolutos para os ícones
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'treino-reminder',
      renotify: true,
      data: {
        // Garante que a URL sempre tenha o parâmetro da ação
        url: data.url ? `${data.url}${data.url.includes('?') ? '&' : '?'}action=open_mood_selector` : '/?action=open_mood_selector'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Ignite', options)
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
          // Se achou, foca nela e navega para a URL com o parâmetro de abertura
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