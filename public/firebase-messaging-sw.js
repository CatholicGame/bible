// Firebase Cloud Messaging Service Worker
// Handles background notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB6Zzp-JR5rngyrlU0YW1ORI2wm6B0LlWs',
  authDomain: 'catholicquizz-a15d0.firebaseapp.com',
  projectId: 'catholicquizz-a15d0',
  storageBucket: 'catholicquizz-a15d0.firebasestorage.app',
  messagingSenderId: '417071319468',
  appId: '1:417071319468:web:be8317b6b7cc38d5fb5209',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Catholic Quiz', {
    body: body || '',
    icon: icon || '/vite.svg',
    vibrate: [200, 100, 200],
    requireInteraction: false,
  });
});

// Click on notification → open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
