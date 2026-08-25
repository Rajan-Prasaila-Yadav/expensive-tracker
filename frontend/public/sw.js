const CACHE_NAME = 'financeos-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch for API calls, standard browser cache for static assets
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
});
