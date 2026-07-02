// Native IndexedDB wrapper for offline functionality
let db: IDBDatabase | null = null;
const DB_VERSION = 2;

export async function initOfflineDB() {
  if (db) return db;
  
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('alhuic-offline', DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const currentDb = (event.target as IDBOpenDBRequest).result;
      const stores = [
        'queue', 'vitals', 'consultations', 'prescriptions', 
        'payments', 'tests', 'sync_queue', 'patients', 
        'appointments', 'doctors', 'facilities', 'inventory',
        'cache_metadata'
      ];
      
      for (const store of stores) {
        if (!currentDb.objectStoreNames.contains(store)) {
          if (store === 'sync_queue') {
            const syncStore = currentDb.createObjectStore(store, { keyPath: 'id' });
            syncStore.createIndex('timestamp', 'timestamp');
          } else if (store === 'cache_metadata') {
            currentDb.createObjectStore(store, { keyPath: 'key' });
          } else {
            currentDb.createObjectStore(store);
          }
        }
      }
    };
  });
}

export async function saveToOffline(store: string, key: string, data: any) {
  const database = await initOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(store, 'readwrite');
    const objectStore = transaction.objectStore(store);
    const request = objectStore.put(data, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getFromOffline(store: string, key: string) {
  const database = await initOfflineDB();
  return new Promise<any>((resolve, reject) => {
    const transaction = database.transaction(store, 'readonly');
    const objectStore = transaction.objectStore(store);
    const request = objectStore.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function addToSyncQueue(endpoint: string, method: string, data: any) {
  const database = await initOfflineDB();
  const id = `${endpoint}-${Date.now()}`;
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('sync_queue', 'readwrite');
    const objectStore = transaction.objectStore('sync_queue');
    const request = objectStore.put({
      id,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
    });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getSyncQueue() {
  const database = await initOfflineDB();
  return new Promise<any[]>((resolve, reject) => {
    const transaction = database.transaction('sync_queue', 'readonly');
    const objectStore = transaction.objectStore('sync_queue');
    const request = objectStore.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function removeFromSyncQueue(id: string) {
  const database = await initOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('sync_queue', 'readwrite');
    const objectStore = transaction.objectStore('sync_queue');
    const request = objectStore.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearOfflineStore(store: string) {
  const database = await initOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(store, 'readwrite');
    const objectStore = transaction.objectStore(store);
    const request = objectStore.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export function isOnline() {
  return navigator.onLine;
}

export function onOnline(callback: () => void) {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

export function onOffline(callback: () => void) {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
}

export async function cacheApiResponse(endpoint: string, data: any, ttlMinutes: number = 60) {
  const database = await initOfflineDB();
  const key = endpoint.replace(/\//g, '_');
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('cache_metadata', 'readwrite');
    const store = transaction.objectStore('cache_metadata');
    const request = store.put({ key, data, expiresAt, cachedAt: Date.now() });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getCachedApiResponse(endpoint: string) {
  const database = await initOfflineDB();
  const key = endpoint.replace(/\//g, '_');
  
  return new Promise<any>((resolve, reject) => {
    const transaction = database.transaction('cache_metadata', 'readonly');
    const store = transaction.objectStore('cache_metadata');
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result;
      if (result && result.expiresAt > Date.now()) {
        resolve(result.data);
      } else {
        resolve(null);
      }
    };
  });
}

export async function getPendingSyncCount() {
  try {
    const queue = await getSyncQueue();
    return queue?.length || 0;
  } catch {
    return 0;
  }
}

export async function clearExpiredCache() {
  const database = await initOfflineDB();
  
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('cache_metadata', 'readwrite');
    const store = transaction.objectStore('cache_metadata');
    const request = store.openCursor();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        if (cursor.value.expiresAt < Date.now()) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
}
