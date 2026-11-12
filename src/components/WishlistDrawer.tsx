import React, { useEffect } from 'react';
import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { getPrimaryImage } from '../services/catalogLogic';
import { formatINR } from '../services/pricingLogic';
import type { Product, ProductSize } from '../types/store';
import { ResolvedImage } from './ResolvedImage';

interface WishlistDrawerProps {
  open: boolean;
  wishlistIds: string[];
  productsById: Record<string, Product | undefined>;
  onClose: () => void;
  onRemoveWishlist: (productId: string) => void;
  onOpenProduct: (productId: string) => void;
  onMoveToBag: (params: {
    productId: string;
    size: ProductSize;
    colorName: string;
    colorHex: string;
  }) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  open,
  wishlistIds,
  productsById,
  onClose,
  onRemoveWishlist,
  onOpenProduct,
  onMoveToBag,
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

  const wishlistProducts = wishlistIds
    .map((id) => productsById[id])
    .filter((p): p is Product => Boolean(p));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Wishlist">
      <div
        className="fixed inset-0 bg-[#2A1121]/45 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#FDFBF9] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EFE3E9] bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Heart className="h-5 w-5 text-[#8C1D5E]" />
            <h2 className="font-serif text-xl font-semibold text-[#5A0D3F]">
              Saved Wishlist ({wishlistProducts.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wishlist"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5A0D3F] hover:bg-[#F8EEF2]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {wishlistProducts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F8EEF2] text-[#5A0D3F]">
                <Heart className="h-6 w-6" />
              </div>
              <p className="mt-4 font-serif text-xl font-semibold text-[#5A0D3F]">
                Your wishlist is empty
              </p>
              <p className="mt-1.5 max-w-xs text-xs text-[#7A5B6B]">
                Tap the heart icon on any style you love to keep it saved here across visits.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-full bg-[#5A0D3F] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554]"
              >
                Explore Styles
              </button>
            </div>
          ) : (
            wishlistProducts.map((product) => {
              const img = getPrimaryImage(product);
              const defaultSize = product.sizes[1] ?? product.sizes[0] ?? 'M';
              const defaultColor = product.colors[0] ?? {
                name: 'Classic',
                hex: '#5A0D3F',
              };
              const isOutOfStock = product.status === 'out_of_stock';

              return (
                <div
                  key={product.id}
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
                        onClick={() => onRemoveWishlist(product.id)}
                        aria-label={`Remove ${product.name} from wishlist`}
                        className="text-[#8E6F80] hover:text-[#A81D63] p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-sm font-bold text-[#5A0D3F] tabular-nums">
                      {formatINR(product.sellingPrice)}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          onMoveToBag({
                            productId: product.id,
                            size: defaultSize,
                            colorName: defaultColor.name,
                            colorHex: defaultColor.hex,
                          });
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          isOutOfStock
                            ? 'bg-[#EDE3E8] text-[#8E6F80] cursor-not-allowed'
                            : 'bg-[#5A0D3F] text-white hover:bg-[#7A1554]'
                        }`}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>{isOutOfStock ? 'Unavailable' : `Add (${defaultSize})`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onOpenProduct(product.id);
                          onClose();
                        }}
                        className="text-xs font-medium text-[#5A0D3F] hover:underline"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
