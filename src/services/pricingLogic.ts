import type { CartItem, Product } from '../types/store';

export const FREE_SHIPPING_THRESHOLD_INR = 999;
export const STANDARD_SHIPPING_FEE_INR = 79;

export function calculateDiscountPercent(sellingPrice: number, originalPrice: number): number {
  if (originalPrice <= 0 || sellingPrice <= 0 || sellingPrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
}

export function formatINR(amount: number): string {
  const safe = Math.max(0, Math.round(amount));
  return `₹${safe.toLocaleString('en-IN')}`;
}

export interface CartTotals {
  subtotal: number;
  totalItems: number;
  totalSavings: number;
  qualifiesForFreeShipping: boolean;
  shippingFee: number;
  amountToFreeShipping: number;
  grandTotal: number;
}

export function calculateCartTotals(
  items: CartItem[],
  productsById: Record<string, Product | undefined>,
  freeShippingThreshold = FREE_SHIPPING_THRESHOLD_INR
): CartTotals {
  let subtotal = 0;
  let totalItems = 0;
  let totalSavings = 0;

  for (const item of items) {
    const product = productsById[item.productId];
    if (!product || item.quantity <= 0) continue;

    subtotal += product.sellingPrice * item.quantity;
    totalItems += item.quantity;

    if (product.originalPrice > product.sellingPrice) {
      totalSavings += (product.originalPrice - product.sellingPrice) * item.quantity;
    }
  }

  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold || totalItems === 0;
  const shippingFee = totalItems === 0 || qualifiesForFreeShipping ? 0 : STANDARD_SHIPPING_FEE_INR;
  const amountToFreeShipping =
    totalItems === 0 ? freeShippingThreshold : Math.max(0, freeShippingThreshold - subtotal);

  return {
    subtotal,
    totalItems,
    totalSavings,
    qualifiesForFreeShipping,
    shippingFee,
    amountToFreeShipping,
    grandTotal: subtotal + shippingFee,
  };
}
