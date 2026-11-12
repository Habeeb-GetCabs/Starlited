/**
 * Frontend Image Storage Service (IndexedDB)
 * -----------------------------------------------------------------------------
 * Stores uploaded product photography blobs in browser IndexedDB so large image
 * payloads never bloat localStorage and survive page refreshes / restarts.
 *
 * Designed as an isolated adapter interface so swapping to Supabase Storage
 * in a later backend phase requires updating only this module.
 */

const DB_NAME = 'starlites_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'product_images';

interface StoredImageRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  fileName: string;
  createdAt: string;
}

const objectUrlCache = new Map<string, string>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });
}

export async function saveImageFile(file: File): Promise<string> {
  const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const db = await openDatabase();

  const record: StoredImageRecord = {
    id,
    blob: file,
    mimeType: file.type || 'image/jpeg',
    fileName: file.name || `${id}.jpg`,
    createdAt: new Date().toISOString(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to store image in IndexedDB.'));
  });

  // Prime object URL cache immediately for instant preview
  const url = URL.createObjectURL(file);
  objectUrlCache.set(id, url);

  return id;
}

export async function getImageObjectUrl(imageId: string): Promise<string | null> {
  const cached = objectUrlCache.get(imageId);
  if (cached) return cached;

  try {
    const db = await openDatabase();
    const record = await new Promise<StoredImageRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(imageId);
      req.onsuccess = () => resolve(req.result as StoredImageRecord | undefined);
      req.onerror = () => reject(req.error);
    });

    if (!record?.blob) return null;
    const url = URL.createObjectURL(record.blob);
    objectUrlCache.set(imageId, url);
    return url;
  } catch {
    return null;
  }
}

export async function deleteImageFile(imageId: string): Promise<void> {
  const cached = objectUrlCache.get(imageId);
  if (cached) {
    URL.revokeObjectURL(cached);
    objectUrlCache.delete(imageId);
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(imageId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore cleanup failures
  }
}

export async function clearAllUploadedImages(): Promise<void> {
  for (const url of objectUrlCache.values()) {
    URL.revokeObjectURL(url);
  }
  objectUrlCache.clear();

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore cleanup failures
  }
}
