import type { CartItem, ProductSize } from '../types/store';

export function buildCartItemKey(productId: string, size: ProductSize, colorName: string): string {
  return `${productId}__${size}__${colorName.trim().toLowerCase()}`;
}

export function addItemToCart(
  current: CartItem[],
  params: {
    productId: string;
    size: ProductSize;
    colorName: string;
    colorHex: string;
    quantity?: number;
  }
): CartItem[] {
  const qty = Math.max(1, params.quantity ?? 1);
  const key = buildCartItemKey(params.productId, params.size, params.colorName);
  const existingIndex = current.findIndex((item) => item.key === key);

  if (existingIndex >= 0) {
    return current.map((item, idx) =>
      idx === existingIndex ? { ...item, quantity: item.quantity + qty } : item
    );
  }

  return [
    ...current,
    {
      key,
      productId: params.productId,
      size: params.size,
      colorName: params.colorName,
      colorHex: params.colorHex,
      quantity: qty,
      addedAt: new Date().toISOString(),
    },
  ];
}

export function updateCartItemQty(current: CartItem[], key: string, delta: number): CartItem[] {
  return current
    .map((item) => {
      if (item.key !== key) return item;
      return { ...item, quantity: item.quantity + delta };
    })
    .filter((item) => item.quantity > 0);
}

export function removeCartItem(current: CartItem[], key: string): CartItem[] {
  return current.filter((item) => item.key !== key);
}

export function toggleWishlistId(current: string[], productId: string): string[] {
  if (current.includes(productId)) {
    return current.filter((id) => id !== productId);
  }
  return [productId, ...current];
}
