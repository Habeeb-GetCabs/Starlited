import { SEED_PRODUCTS } from '../data/seedProducts';
import type { Product } from '../types/store';

const STORAGE_KEY = 'starlites_products_v1';

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
