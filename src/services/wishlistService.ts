const WISHLIST_STORAGE_KEY = 'starlites_wishlist_v1';

export function loadWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWishlist(productIds: string[]): void {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(productIds));
  } catch {
    // Ignore storage errors
  }
}
