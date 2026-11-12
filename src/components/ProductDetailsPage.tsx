import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Ruler,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import {
  getCategoryLabel,
  getRelatedProducts,
} from '../services/catalogLogic';
import { calculateDiscountPercent, formatINR } from '../services/pricingLogic';
import type { AppRoute, Product, ProductSize } from '../types/store';
import { ProductCard } from './ProductCard';
import { ResolvedImage } from './ResolvedImage';

interface ProductDetailsPageProps {
  product: Product | undefined;
  allProducts: Product[];
  wishlistIds: string[];
  onNavigate: (route: AppRoute) => void;
  onToggleWishlist: (productId: string) => void;
  onAddToBag: (params: {
    productId: string;
    size: ProductSize;
    colorName: string;
    colorHex: string;
    quantity: number;
  }) => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  product,
  allProducts,
  wishlistIds,
  onNavigate,
  onToggleWishlist,
  onAddToBag,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    setActiveImageIdx(0);
    setSelectedSize(null);
    setSelectedColorIdx(0);
    setQuantity(1);
    setSizeError(false);
    setAddedFeedback(false);
  }, [product?.id]);

  if (!product) {
    return (
      <div className="mx-auto max-w-[1360px] px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold text-[#5A0D3F]">
          Product not found
        </h1>
        <p className="mt-2 text-sm text-[#7A5B6B]">
          This item may have been removed or updated in the catalog.
        </p>
        <button
          type="button"
          onClick={() => onNavigate({ view: 'shop', category: 'all' })}
          className="mt-6 rounded-full bg-[#5A0D3F] px-6 py-3 text-sm font-semibold text-white"
        >
          Browse All Styles
        </button>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [null];
  const activeImage = images[activeImageIdx] ?? images[0];
  const discountPercent = calculateDiscountPercent(
    product.sellingPrice,
    product.originalPrice
  );
  const activeColor = product.colors[selectedColorIdx] ?? {
    name: 'Signature',
    hex: '#5A0D3F',
  };
  const isWishlisted = wishlistIds.includes(product.id);
  const isOutOfStock = product.status === 'out_of_stock';
  const relatedProducts = getRelatedProducts(allProducts, product, 4);

  const handleAddClick = () => {
    if (isOutOfStock) return;
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    onAddToBag({
      productId: product.id,
      size: selectedSize,
      colorName: activeColor.name,
      colorHex: activeColor.hex,
      quantity,
    });
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 1800);
  };

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#7A5B6B] mb-6 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onNavigate({ view: 'home' })}
          className="hover:text-[#5A0D3F] hover:underline"
        >
          Home
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => onNavigate({ view: 'shop', category: product.category })}
          className="hover:text-[#5A0D3F] hover:underline"
        >
          {getCategoryLabel(product.category)}
        </button>
        <span>/</span>
        <span className="font-medium text-[#5A0D3F]">{product.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Gallery */}
        <div className="lg:col-span-6 space-y-3">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-3xl bg-[#F8F3EF] border border-[#EFE3E9]">
            <ResolvedImage
              image={activeImage}
              alt={`${product.name} view ${activeImageIdx + 1}`}
              loading="eager"
              className="h-full w-full object-cover object-top"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <button
                  key={img?.id ?? idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`View thumbnail ${idx + 1} of ${product.name}`}
                  className={`aspect-[3/4] overflow-hidden rounded-xl border-2 transition-all ${
                    activeImageIdx === idx
                      ? 'border-[#5A0D3F] ring-2 ring-[#5A0D3F]/20'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <ResolvedImage
                    image={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover object-top"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-6 lg:sticky lg:top-32 rounded-3xl bg-white p-6 sm:p-8 border border-[#EFE3E9]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8C1D5E]">
              {getCategoryLabel(product.category)}
            </span>
            {product.isNewArrival && (
              <span className="text-xs font-semibold text-[#5A0D3F]">New Arrival</span>
            )}
          </div>

          <h1 className="mt-2 font-serif text-2xl sm:text-4xl font-semibold text-[#2A1121] leading-tight">
            {product.name}
          </h1>

          {/* Price Block */}
          <div className="mt-4 flex flex-wrap items-baseline gap-3 tabular-nums">
            <span className="text-2xl sm:text-3xl font-bold text-[#5A0D3F]">
              {formatINR(product.sellingPrice)}
            </span>
            {product.originalPrice > product.sellingPrice && (
              <span className="text-base text-[#8D6E7E] line-through">
                {formatINR(product.originalPrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="rounded-md bg-[#F8E2EC] px-2.5 py-1 text-xs font-semibold text-[#8C1D5E]">
                {discountPercent}% OFF
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#7A5B6B]">Inclusive of all taxes</p>

          {/* Description */}
          <p className="mt-5 text-sm leading-relaxed text-[#4E2A3E]">
            {product.description}
          </p>

          {/* Color Selector */}
          {product.colors.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[#F4EAEF]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#2A1121]">
                  Colour: <span className="text-[#5A0D3F]">{activeColor.name}</span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.colors.map((color, idx) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColorIdx(idx)}
                    aria-label={`Select colour ${color.name}`}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                      selectedColorIdx === idx
                        ? 'border-[#5A0D3F] bg-[#F8EEF2] text-[#5A0D3F] font-semibold'
                        : 'border-[#E5D3DC] bg-white text-[#4E2A3E] hover:border-[#5A0D3F]'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/15"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          <div className="mt-6 pt-5 border-t border-[#F4EAEF]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2A1121]">
                Select Size{' '}
                {selectedSize ? (
                  <span className="text-[#5A0D3F]">— {selectedSize} selected</span>
                ) : (
                  <span className="text-[#8E6F80] font-normal">(Required)</span>
                )}
              </span>

              <button
                type="button"
                onClick={() => onNavigate({ view: 'info', page: 'size-guide' })}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C1D5E] hover:underline"
              >
                <Ruler className="h-3.5 w-3.5" />
                <span>Size Guide</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((size) => {
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                    className={`min-w-[46px] rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#5A0D3F] text-white shadow-xs'
                        : 'border border-[#DEC8D3] bg-white text-[#2A1121] hover:border-[#5A0D3F]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {sizeError && (
              <div
                role="alert"
                className="mt-3 flex items-center gap-2 rounded-xl bg-[#FDF0F3] border border-[#E7B5C6] px-3.5 py-2.5 text-xs font-medium text-[#8C1D5E]"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Please choose a size above before adding this item to your bag.</span>
              </div>
            )}
          </div>

          {/* Quantity & Action Buttons */}
          <div className="mt-6 pt-5 border-t border-[#F4EAEF] space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2A1121]">
                Quantity
              </span>
              <div className="inline-flex items-center rounded-full border border-[#DEC8D3] bg-[#FDFBF9]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#5A0D3F] hover:bg-[#F8EEF2]"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  aria-label="Increase quantity"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#5A0D3F] hover:bg-[#F8EEF2]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddClick}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full py-3.5 px-6 text-sm font-semibold transition-colors ${
                  isOutOfStock
                    ? 'cursor-not-allowed bg-[#EDE3E8] text-[#8E6F80]'
                    : addedFeedback
                    ? 'bg-[#2E6F4E] text-white'
                    : 'bg-[#5A0D3F] text-white hover:bg-[#7A1554]'
                }`}
              >
                {addedFeedback ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Added to Shopping Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>{isOutOfStock ? 'Currently Out of Stock' : 'Add to Bag'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-sm font-semibold transition-colors ${
                  isWishlisted
                    ? 'border-[#8C1D5E] bg-[#F8EEF2] text-[#8C1D5E]'
                    : 'border-[#D4B4C4] bg-white text-[#5A0D3F] hover:bg-[#F8EEF2]'
                }`}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
              </button>
            </div>
          </div>

          {/* Fabric & Care + Assurances */}
          <div className="mt-6 pt-5 border-t border-[#F4EAEF] space-y-2.5 text-xs text-[#5B364B]">
            <p>
              <span className="font-semibold text-[#2A1121]">Fabric &amp; Care:</span>{' '}
              {product.fabricCare}
            </p>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#5A0D3F]" />
              <span>Free shipping across India on orders above ₹999</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-[#5A0D3F]" />
              <span>7-day easy size exchange from Tiruchirappalli</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-14 pt-10 border-t border-[#EFE3E9]">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#5A0D3F]">
                You May Also Shine In
              </h2>
              <p className="mt-1 text-sm text-[#7A5B6B]">
                Curated pairings and complementary styles
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                isWishlisted={wishlistIds.includes(rel.id)}
                onOpenProduct={(id) => onNavigate({ view: 'product', productId: id })}
                onToggleWishlist={onToggleWishlist}
                onAddToBag={(params) => onAddToBag({ ...params, quantity: 1 })}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
