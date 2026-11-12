import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { SEED_PRODUCTS } from '../data/seedProducts';
import { OperationType, db, handleFirestoreError } from '../firebase';
import type { Product, ProductColor, ProductImageRef, ProductSize } from '../types/store';

const STORAGE_KEY = 'starlites_products_v1';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `prod_${Date.now()}`;
}

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function docToProduct(id: string, data: DocumentData): Product {
  const sizes: ProductSize[] = Array.isArray(data.sizes) && data.sizes.length > 0
    ? (data.sizes as ProductSize[])
    : ['M'];
  const colors: ProductColor[] = Array.isArray(data.colors) && data.colors.length > 0
    ? (data.colors as ProductColor[])
    : [{ name: 'Classic Plum', hex: '#5A0D3F' }];
  const images: ProductImageRef[] = Array.isArray(data.images) && data.images.length > 0
    ? (data.images as ProductImageRef[])
    : [{ id: `fallback_${id}`, source: 'asset', assetKey: 'cat_tops_14plus', isPrimary: true }];

  return {
    id,
    slug: String(data.slug || id),
    name: String(data.name || 'Untitled Style'),
    category: data.category,
    description: String(data.description || ''),
    fabricCare: String(data.fabricCare || ''),
    sellingPrice: Number(data.sellingPrice) || 0,
    originalPrice: Number(data.originalPrice) || Number(data.sellingPrice) || 0,
    sizes,
    colors,
    status: data.status || 'active',
    isNewArrival: Boolean(data.isNewArrival),
    isBestSeller: Boolean(data.isBestSeller),
    popularityScore: Number(data.popularityScore) || 75,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    images,
  };
}

function buildProductFirestorePayload(product: Product, isCreate: boolean) {
  const id = sanitizeId(product.id);
  const sellingPrice = Math.max(0, Math.min(500000, Math.round(Number(product.sellingPrice) || 0)));
  const originalPrice = Math.max(
    sellingPrice,
    Math.min(500000, Math.round(Number(product.originalPrice) || sellingPrice))
  );

  const sizes = (product.sizes.length > 0 ? product.sizes : (['M'] as ProductSize[])).slice(0, 7);
  const colors = (
    product.colors.length > 0 ? product.colors : [{ name: 'Classic Plum', hex: '#5A0D3F' }]
  )
    .slice(0, 15)
    .map((c) => ({
      name: String(c.name).trim().slice(0, 60) || 'Classic',
      hex: String(c.hex).trim().slice(0, 16) || '#5A0D3F',
    }));

  const images = (
    product.images.length > 0
      ? product.images
      : [{ id: `fallback_${id}`, source: 'asset' as const, assetKey: 'cat_tops_14plus', isPrimary: true }]
  )
    .slice(0, 10)
    .map((img) => {
      const clean: Record<string, unknown> = {
        id: sanitizeId(img.id),
        source: img.source,
        isPrimary: Boolean(img.isPrimary),
      };
      if (img.assetKey) clean.assetKey = String(img.assetKey).slice(0, 120);
      if (img.url) clean.url = String(img.url).slice(0, 500);
      if (img.alt) clean.alt = String(img.alt).slice(0, 160);
      return clean;
    });

  const basePayload = {
    id,
    slug: String(product.slug || id).slice(0, 160),
    name: String(product.name).trim().slice(0, 140),
    category: product.category,
    description: (String(product.description).trim() || 'Thoughtfully crafted everyday wear.').slice(0, 2000),
    fabricCare: (String(product.fabricCare).trim() || '100% Breathable Cotton · Gentle wash.').slice(0, 500),
    sellingPrice,
    originalPrice,
    sizes,
    colors,
    status: product.status,
    isNewArrival: Boolean(product.isNewArrival),
    isBestSeller: Boolean(product.isBestSeller),
    popularityScore: Math.max(0, Math.min(100000, Math.round(Number(product.popularityScore) || 80))),
    images,
    updatedAt: serverTimestamp(),
  };

  if (isCreate) {
    return {
      ...basePayload,
      createdAt: serverTimestamp(),
    };
  }

  return basePayload;
}

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PRODUCTS));
      return SEED_PRODUCTS;
    }
    const parsed = JSON.parse(raw) as Product[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SEED_PRODUCTS;
    }
    return parsed;
  } catch {
    return SEED_PRODUCTS;
  }
}

export function saveAllProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // Handle storage quota safely
  }
}

export function upsertProduct(products: Product[], product: Product): Product[] {
  const exists = products.some((p) => p.id === product.id);
  const next = exists
    ? products.map((p) => (p.id === product.id ? product : p))
    : [product, ...products];
  saveAllProducts(next);
  return next;
}

export function removeProductById(products: Product[], productId: string): Product[] {
  const next = products.filter((p) => p.id !== productId);
  saveAllProducts(next);
  return next;
}

export function resetCatalogToDefaults(): Product[] {
  saveAllProducts(SEED_PRODUCTS);
  return SEED_PRODUCTS;
}

export function subscribeProducts(
  isAdmin: boolean,
  onData: (products: Product[], isFromCloud: boolean) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'products';
  const q = isAdmin
    ? collection(db, path)
    : query(collection(db, path), where('status', 'in', ['active', 'out_of_stock']));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(isAdmin ? [] : SEED_PRODUCTS, false);
        return;
      }
      const list = snapshot.docs
        .map((d) => docToProduct(d.id, d.data()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveAllProducts(list);
      onData(list, true);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function saveProductToCloud(product: Product, isNew: boolean): Promise<void> {
  const id = sanitizeId(product.id);
  const path = `products/${id}`;
  const docRef = doc(db, 'products', id);

  try {
    if (isNew) {
      await setDoc(docRef, buildProductFirestorePayload({ ...product, id }, true));
    } else {
      await setDoc(docRef, buildProductFirestorePayload({ ...product, id }, false), { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteProductFromCloud(productId: string): Promise<void> {
  const id = sanitizeId(productId);
  const path = `products/${id}`;
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function seedDefaultCatalogToCloud(overwriteExisting: boolean = false): Promise<number> {
  const path = 'products';
  try {
    if (!overwriteExisting) {
      const existingSnap = await getDocs(collection(db, path));
      if (!existingSnap.empty) {
        return existingSnap.size;
      }
    }

    const batch = writeBatch(db);
    for (const seed of SEED_PRODUCTS) {
      const id = sanitizeId(seed.id);
      const ref = doc(db, 'products', id);
      batch.set(ref, buildProductFirestorePayload({ ...seed, id }, true));
    }
    await batch.commit();
    saveAllProducts(SEED_PRODUCTS);
    return SEED_PRODUCTS.length;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
