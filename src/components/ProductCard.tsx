import React, { useState } from 'react';
import { Check, Heart, ShoppingBag } from 'lucide-react';
import { getPrimaryImage } from '../services/catalogLogic';
import { calculateDiscountPercent, formatINR } from '../services/pricingLogic';
import type { Product, ProductSize } from '../types/store';
import { ResolvedImage } from './ResolvedImage';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onOpenProduct: (productId: string) => void;
  onToggleWishlist: (productId: string) => void;
  onAddToBag: (params: {
    productId: string;
    size: ProductSize;
    colorName: string;
    colorHex: string;
  }) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onOpenProduct,
  onToggleWishlist,
  onAddToBag,
}) => {
  const [selectedSize, setSelectedSize] = useState<ProductSize>(
    product.sizes[1] ?? product.sizes[0] ?? 'M'
  );
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const primaryImage = getPrimaryImage(product);
  const discountPercent = calculateDiscountPercent(
    product.sellingPrice,
    product.originalPrice
  );
  const activeColor = product.colors[selectedColorIdx] ?? {
    name: 'Classic',
    hex: '#5A0D3F',
  };
  const isOutOfStock = product.status === 'out_of_stock';

  const badgeLabel = product.isNewArrival
    ? 'New'
    : product.isBestSeller
    ? 'Best Seller'
    : null;

  const handleQuickAdd = () => {
    if (isOutOfStock) return;
    onAddToBag({
      productId: product.id,
      size: selectedSize,
      colorName: activeColor.name,
      colorHex: activeColor.hex,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <article className="group flex flex-col rounded-2xl bg-white p-3 border border-[#EFE3E9] shadow-[0_2px_12px_rgba(90,13,63,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(90,13,63,0.09)]">
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#F8F3EF]">
        <button
          type="button"
          onClick={() => onOpenProduct(product.id)}
          className="block h-full w-full text-left focus-visible:outline-2 focus-visible:outline-[#5A0D3F]"
          aria-label={`View ${product.name}`}
        >
          <ResolvedImage
            image={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </button>

        {badgeLabel && (
          <span className="pointer-events-none absolute top-2.5 left-2.5 rounded-md bg-[#5A0D3F] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-xs">
            {badgeLabel}
          </span>
        )}

        {isOutOfStock && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#6F4359]">
            Out of Stock
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className={`absolute top-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#5A0D3F] ${
            isWishlisted
              ? 'text-[#A81D63]'
              : 'text-[#5A0D3F] hover:bg-[#F8EEF2]'
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Info */}
      <div className="mt-3 flex flex-1 flex-col">
        <button
          type="button"
          onClick={() => onOpenProduct(product.id)}
          className="text-left focus-visible:outline-2 focus-visible:outline-[#5A0D3F] rounded"
        >
          <h3 className="font-sans text-[15px] font-semibold leading-snug text-[#2A1121] line-clamp-1 group-hover:text-[#5A0D3F] transition-colors">
            {product.name}
          </h3>
        </button>

        {/* Price Row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 tabular-nums">
          <span className="text-[15px] font-bold text-[#2A1121]">
            {formatINR(product.sellingPrice)}
          </span>
          {product.originalPrice > product.sellingPrice && (
            <span className="text-xs text-[#8D6E7E] line-through">
              {formatINR(product.originalPrice)}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="rounded bg-[#F8E2EC] px-1.5 py-0.5 text-[11px] font-semibold text-[#8C1D5E]">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Color Dots */}
        {product.colors.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {product.colors.map((color, idx) => (
              <button
                key={color.name}
                type="button"
                onClick={() => setSelectedColorIdx(idx)}
                aria-label={`Select color ${color.name} for ${product.name}`}
                title={color.name}
                className={`h-4 w-4 rounded-full border transition-transform ${
                  selectedColorIdx === idx
                    ? 'scale-110 ring-2 ring-[#5A0D3F] ring-offset-1 border-white'
                    : 'border-[#D8C5CF]'
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
            <span className="ml-1 text-[11px] text-[#7A5B6B] truncate">
              {activeColor.name}
            </span>
          </div>
        )}

        {/* Size Pills */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1">
          {product.sizes.slice(0, 5).map((size) => {
            const active = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                aria-label={`Select size ${size} for ${product.name}`}
                className={`min-w-[28px] rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                  active
                    ? 'bg-[#5A0D3F] text-white'
                    : 'border border-[#E5D3DC] bg-white text-[#4E2A3E] hover:border-[#5A0D3F]'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>

        {/* Add to Bag Button */}
        <div className="mt-auto pt-3">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleQuickAdd}
            aria-label={
              isOutOfStock
                ? `${product.name} is unavailable`
                : `Add ${product.name} size ${selectedSize} to bag`
            }
            className={`flex w-full items-center justify-center gap-2 rounded-full py-2.5 px-4 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#5A0D3F] ${
              isOutOfStock
                ? 'cursor-not-allowed bg-[#EDE3E8] text-[#8E6F80]'
                : justAdded
                ? 'bg-[#2E6F4E] text-white'
                : 'bg-[#5A0D3F] text-white hover:bg-[#7A1554]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{isOutOfStock ? 'Unavailable' : 'Add to Bag'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
