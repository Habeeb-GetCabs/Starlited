import React, { useEffect } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { getPrimaryImage } from '../services/catalogLogic';
import {
  calculateCartTotals,
  formatINR,
  FREE_SHIPPING_THRESHOLD_INR,
} from '../services/pricingLogic';
import type { CartItem, Product } from '../types/store';
import { ResolvedImage } from './ResolvedImage';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  productsById: Record<string, Product | undefined>;
  onClose: () => void;
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onOpenProduct: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  items,
  productsById,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onOpenProduct,
  onProceedToCheckout,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const totals = calculateCartTotals(items, productsById);
  const progressPercent = Math.min(
    100,
    Math.round((totals.subtotal / FREE_SHIPPING_THRESHOLD_INR) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Bag">
      <div
        className="fixed inset-0 bg-[#2A1121]/45 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#FDFBF9] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EFE3E9] bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-[#5A0D3F]" />
            <h2 className="font-serif text-xl font-semibold text-[#5A0D3F]">
              Shopping Bag ({totals.totalItems})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping bag"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5A0D3F] hover:bg-[#F8EEF2]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Shipping Banner */}
        <div className="border-b border-[#EFE3E9] bg-[#FBF4F7] px-5 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#5A0D3F]">
            <Truck className="h-4 w-4 shrink-0 text-[#8C1D5E]" />
            {totals.totalItems === 0 ? (
              <span>Free shipping across India on orders above ₹999</span>
            ) : totals.qualifiesForFreeShipping ? (
              <span>You unlocked FREE shipping on this bag!</span>
            ) : (
              <span>
                Add <strong className="tabular-nums">{formatINR(totals.amountToFreeShipping)}</strong>{' '}
                more for FREE shipping
              </span>
            )}
          </div>
          {totals.totalItems > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EAD8E1]">
              <div
                className="h-full rounded-full bg-[#5A0D3F] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F8EEF2] text-[#5A0D3F]">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="mt-4 font-serif text-xl font-semibold text-[#5A0D3F]">
                Your shopping bag is empty
              </p>
              <p className="mt-1.5 max-w-xs text-xs text-[#7A5B6B]">
                Explore our tops, matching sets, nightwear, and maxi dresses to find your everyday shine.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-full bg-[#5A0D3F] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554]"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => {
              const product = productsById[item.productId];
              if (!product) return null;
              const img = getPrimaryImage(product);

              return (
                <div
                  key={item.key}
                  className="flex gap-3.5 rounded-2xl bg-white p-3 border border-[#EFE3E9]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onOpenProduct(product.id);
                      onClose();
                    }}
                    className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F8F3EF]"
                    aria-label={`View ${product.name}`}
                  >
                    <ResolvedImage
                      image={img}
                      alt={product.name}
                      className="h-full w-full object-cover object-top"
                    />
                  </button>

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenProduct(product.id);
                          onClose();
                        }}
                        className="text-left"
                      >
                        <h3 className="text-sm font-semibold text-[#2A1121] line-clamp-1 hover:text-[#5A0D3F]">
                          {product.name}
                        </h3>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.key)}
                        aria-label={`Remove ${product.name} (${item.size}) from bag`}
                        className="text-[#8E6F80] hover:text-[#A81D63] p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#7A5B6B]">
                      <span>Size: <strong className="text-[#2A1121]">{item.size}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full border border-black/15"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span>{item.colorName}</span>
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-[#DEC8D3] bg-[#FDFBF9]">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, -1)}
                          aria-label={`Decrease quantity of ${product.name}`}
                          className="flex h-7 w-7 items-center justify-center text-[#5A0D3F] hover:bg-[#F8EEF2] rounded-full"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, 1)}
                          aria-label={`Increase quantity of ${product.name}`}
                          className="flex h-7 w-7 items-center justify-center text-[#5A0D3F] hover:bg-[#F8EEF2] rounded-full"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-sm font-bold text-[#5A0D3F] tabular-nums">
                        {formatINR(product.sellingPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Totals */}
        {items.length > 0 && (
          <div className="border-t border-[#EFE3E9] bg-white px-5 py-4 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-[#4E2A3E]">
                <span>Subtotal</span>
                <span className="font-semibold tabular-nums">{formatINR(totals.subtotal)}</span>
              </div>
              {totals.totalSavings > 0 && (
                <div className="flex items-center justify-between text-xs text-[#2E6F4E]">
                  <span>Catalog Savings</span>
                  <span className="font-semibold tabular-nums">−{formatINR(totals.totalSavings)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-[#7A5B6B]">
                <span>Estimated Shipping</span>
                <span className="tabular-nums">
                  {totals.shippingFee === 0 ? 'FREE' : formatINR(totals.shippingFee)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full rounded-full bg-[#5A0D3F] py-3.5 text-sm font-semibold text-white hover:bg-[#7A1554] transition-colors"
            >
              Proceed to Checkout · {formatINR(totals.grandTotal)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
