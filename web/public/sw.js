// Service worker mínimo, só para Web Push (sem cache/offline).

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body ?? undefined,
      icon: '/favicon.svg',
      data: payload.data ?? {},
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data ?? {};
  const url = data.game_id ? `/games/${data.game_id}` : '/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
