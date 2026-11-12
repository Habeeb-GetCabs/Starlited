import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { OperationType, auth, db, handleFirestoreError } from '../firebase';

/**
 * Unified Product Media Service (Firestore Shared Media + IndexedDB Local Cache)
 * -----------------------------------------------------------------------------
 * Compresses uploaded product photography client-side (< 480 KB JPEG) and stores
 * it in Firestore (`media/{mediaId}`) so all shoppers across devices see real
 * uploaded dress photos immediately, while caching blobs locally in IndexedDB
 * for instant repeat loads and minimal read usage.
 */

const DB_NAME = 'starlites_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'product_images';
const MAX_DATA_URL_LENGTH = 480000;

interface StoredImageRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  fileName: string;
  createdAt: string;
}

const objectUrlCache = new Map<string, string>();
const inFlightFetches = new Map<string, Promise<string | null>>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });
}

async function cacheBlobLocally(id: string, blob: Blob, fileName: string): Promise<string> {
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(id, url);

  try {
    const database = await openDatabase();
    const record: StoredImageRecord = {
      id,
      blob,
      mimeType: blob.type || 'image/jpeg',
      fileName: fileName.slice(0, 160),
      createdAt: new Date().toISOString(),
    };

    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to cache image in IndexedDB.'));
    });
  } catch {
    // IndexedDB cache is best-effort; memory object URL still works
  }

  return url;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header?.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  const binary = atob(base64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

async function compressFileToDataUrl(file: File): Promise<{ dataUrl: string; blob: Blob }> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode image file.'));
      el.src = imageUrl;
    });

    const maxDim = 920;
    let width = img.naturalWidth || 800;
    let height = img.naturalHeight || 1000;

    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable.');
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let quality = 0.84;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > MAX_DATA_URL_LENGTH && quality > 0.45) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      // Scale down further if image is still dense
      canvas.width = Math.round(canvas.width * 0.72);
      canvas.height = Math.round(canvas.height * 0.72);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    }

    return { dataUrl, blob: dataUrlToBlob(dataUrl) };
  } catch {
    // Fallback for tiny test fixtures / unsupported formats
    const fallbackDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
    return { dataUrl: fallbackDataUrl, blob: file };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export async function saveImageFile(
  file: File
): Promise<{ id: string; source: 'firestore_media' | 'indexeddb' }> {
  const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { dataUrl, blob } = await compressFileToDataUrl(file);
  const safeFileName = (file.name || `${id}.jpg`).slice(0, 160);

  await cacheBlobLocally(id, blob, safeFileName);

  const uid = auth.currentUser?.uid;
  if (uid && dataUrl.length <= MAX_DATA_URL_LENGTH) {
    const path = `media/${id}`;
    try {
      await setDoc(doc(db, 'media', id), {
        id,
        dataUrl,
        mimeType: 'image/jpeg',
        fileName: safeFileName,
        uploadedBy: uid,
        createdAt: serverTimestamp(),
      });
      return { id, source: 'firestore_media' };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  return { id, source: 'indexeddb' };
}

export async function getImageObjectUrl(
  imageId: string,
  source: 'indexeddb' | 'firestore_media' = 'indexeddb'
): Promise<string | null> {
  const cached = objectUrlCache.get(imageId);
  if (cached) return cached;

  const existingPromise = inFlightFetches.get(imageId);
  if (existingPromise) return existingPromise;

  const fetchPromise = (async () => {
    try {
      const database = await openDatabase();
      const record = await new Promise<StoredImageRecord | undefined>((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(imageId);
        req.onsuccess = () => resolve(req.result as StoredImageRecord | undefined);
        req.onerror = () => reject(req.error);
      });

      if (record?.blob) {
        const url = URL.createObjectURL(record.blob);
        objectUrlCache.set(imageId, url);
        return url;
      }
    } catch {
      // Proceed to Firestore fallback if source is firestore_media
    }

    if (source === 'firestore_media') {
      const path = `media/${imageId}`;
      try {
        const snap = await getDoc(doc(db, 'media', imageId));
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.dataUrl === 'string' && data.dataUrl.startsWith('data:')) {
            const blob = dataUrlToBlob(data.dataUrl);
            return await cacheBlobLocally(
              imageId,
              blob,
              typeof data.fileName === 'string' ? data.fileName : `${imageId}.jpg`
            );
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.GET, path);
        }
      }
    }

    return null;
  })();

  inFlightFetches.set(imageId, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlightFetches.delete(imageId);
  }
}

export async function deleteImageFile(
  imageId: string,
  source: 'indexeddb' | 'firestore_media' = 'indexeddb'
): Promise<void> {
  const cached = objectUrlCache.get(imageId);
  if (cached) {
    URL.revokeObjectURL(cached);
    objectUrlCache.delete(imageId);
  }

  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(imageId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore local cache cleanup error
  }

  if (source === 'firestore_media' && auth.currentUser) {
    const path = `media/${imageId}`;
    try {
      await deleteDoc(doc(db, 'media', imageId));
    } catch (err) {
      if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  }
}

export async function clearAllUploadedImages(): Promise<void> {
  for (const url of objectUrlCache.values()) {
    URL.revokeObjectURL(url);
  }
  objectUrlCache.clear();

  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore cleanup failures
  }
}
