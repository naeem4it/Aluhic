const CACHE_NAME = 'alhuic-v9';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Ignore errors, some URLs might not be available yet
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) return;

  // API requests: network first, fallback to cache
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || new Response('Offline - Data not available', { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets: cache first, fallback to network
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  const db = await openDB();
  const syncQueue = await db.getAll('sync_queue');
  
  for (const item of syncQueue) {
    try {
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });
      
      if (response.ok) {
        await db.delete('sync_queue', item.id);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

async function openDB() {
  const DB_VERSION = 2;
  const request = indexedDB.open('alhuic-offline', DB_VERSION);
  
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const stores = [
        'queue', 'vitals', 'consultations', 'prescriptions', 
        'payments', 'tests', 'sync_queue', 'patients', 
        'appointments', 'doctors', 'facilities', 'inventory',
        'cache_metadata'
      ];
      
      for (const store of stores) {
        if (!db.objectStoreNames.contains(store)) {
          if (store === 'sync_queue') {
            const syncStore = db.createObjectStore(store, { keyPath: 'id' });
            syncStore.createIndex('timestamp', 'timestamp');
          } else if (store === 'cache_metadata') {
            db.createObjectStore(store, { keyPath: 'key' });
          } else {
            db.createObjectStore(store);
          }
        }
      }
    };
  });
}
