// public/sw.js
/* eslint-disable no-restricted-globals */

self.addEventListener('push', function (event) {
  let data = {
    title: 'GYM IGNITE',
    body: 'Bora treinar? A chama não pode apagar! 🔥',
    url: '/'
  };

  // Se o servidor enviou dados, nós os usamos
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.warn('Payload não era JSON, usando padrão.');
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'treino-reminder',
    renotify: true,
    data: {
      url: data.url || '/'
    }
  };

  // OBRIGATÓRIO: O Android exige que você retorne a promessa da notificação
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});