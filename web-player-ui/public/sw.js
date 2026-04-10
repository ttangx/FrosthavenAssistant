self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Frosthaven';
  const body = data.body || 'Waiting on your initiative!';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/classes/fh-frozen-fist-bw-icon.png',
      badge: '/icons/classes/fh-frozen-fist-bw-icon.png',
      tag: 'initiative-nudge',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
