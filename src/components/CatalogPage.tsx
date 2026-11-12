import React, { useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_MAP,
  filterProducts,
  sortProducts,
} from '../services/catalogLogic';
import type {
  AppRoute,
  CategorySlug,
  Product,
  ProductSize,
  SortOption,
} from '../types/store';
import { ProductCard } from './ProductCard';

interface CatalogPageProps {
  products: Product[];
  wishlistIds: string[];
  initialCategory?: CategorySlug | 'all';
  collection?: 'new' | 'best';
  searchQuery?: string;
  onNavigate: (route: AppRoute) => void;
  onClearSearch: () => void;
  onToggleWishlist: (productId: string) => void;
  onAddToBag: (params: {
    productId: string;
    size: ProductSize;
    colorName: string;
    colorHex: string;
  }) => void;
}

const ALL_SIZES: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

const PRICE_RANGES = [
  { id: 'all', label: 'All Prices', min: null, max: null },
  { id: 'under-799', label: 'Under ₹799', min: 0, max: 799 },
  { id: '800-1299', label: '₹800 – ₹1,299', min: 800, max: 1299 },
  { id: '1300-plus', label: '₹1,300 & Above', min: 1300, max: null },
];

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  wishlistIds,
  initialCategory = 'all',
  collection,
  searchQuery = '',
  onNavigate,
  onClearSearch,
  onToggleWishlist,
  onAddToBag,
}) => {
  const [selectedSizes, setSelectedSizes] = useState<ProductSize[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRangeId, setPriceRangeId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeCategoryInfo =
    initialCategory !== 'all' ? CATEGORY_MAP[initialCategory] : null;

  // Derive distinct available color names from active products
  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (p.status === 'draft') continue;
      for (const c of p.colors) {
        if (!map.has(c.name)) {
          map.set(c.name, c.hex);
        }
      }
    }
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const activePriceRange =
    PRICE_RANGES.find((r) => r.id === priceRangeId) ?? PRICE_RANGES[0];

  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(products, {
      category: initialCategory,
      query: searchQuery,
      sizes: selectedSizes,
      colors: selectedColors,
      minPrice: activePriceRange.min,
      maxPrice: activePriceRange.max,
      onlyNewArrivals: collection === 'new',
      onlyBestSellers: collection === 'best',
    });
    return sortProducts(filtered, sortBy);
  }, [
    products,
    initialCategory,
    searchQuery,
    selectedSizes,
    selectedColors,
    activePriceRange,
    collection,
    sortBy,
  ]);

  const toggleSize = (size: ProductSize) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName)
        ? prev.filter((c) => c !== colorName)
        : [...prev, colorName]
    );
  };

  const resetAllFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRangeId('all');
    if (searchQuery) onClearSearch();
    if (initialCategory !== 'all' || collection) {
      onNavigate({ view: 'shop', category: 'all' });
    }
  };

  const hasActiveFilters =
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    priceRangeId !== 'all' ||
    searchQuery.trim().length > 0;

  const pageTitle = searchQuery.trim()
    ? `Search results for "${searchQuery.trim()}"`
    : activeCategoryInfo
    ? activeCategoryInfo.name
    : collection === 'new'
    ? 'New Arrivals'
    : collection === 'best'
    ? 'Best Sellers'
    : 'All Women’s Collections';

  const pageDescription = searchQuery.trim()
    ? `Showing matching styles across STARLITES CLOTHING collections.`
    : activeCategoryInfo
    ? activeCategoryInfo.description
    : collection === 'new'
    ? 'Fresh silhouettes, breathable cottons, and newly launched colors.'
    : collection === 'best'
    ? 'Customer favourites crafted for comfort and effortless style.'
    : 'Browse all nine STARLITES CLOTHING categories tailored for everyday shine.';

  const FilterPanel = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5A0D3F] mb-3">
          Category
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate({ view: 'shop', category: 'all' })}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              initialCategory === 'all' && !collection
                ? 'bg-[#F8EEF2] font-semibold text-[#5A0D3F]'
                : 'text-[#4E2A3E] hover:bg-[#F8EEF2]/50'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onNavigate({ view: 'shop', category: cat.slug })}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                initialCategory === cat.slug
                  ? 'bg-[#F8EEF2] font-semibold text-[#5A0D3F]'
                  : 'text-[#4E2A3E] hover:bg-[#F8EEF2]/50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Size Filter */}
      <div className="pt-5 border-t border-[#EFE3E9]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5A0D3F] mb-3">
          Size
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {ALL_SIZES.map((size) => {
            const active = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
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
      </div>

      {/* Price Range Filter */}
      <div className="pt-5 border-t border-[#EFE3E9]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5A0D3F] mb-3">
          Price Range
        </h3>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range) => {
            const active = priceRangeId === range.id;
            return (
              <button
                key={range.id}
                type="button"
                onClick={() => setPriceRangeId(range.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#5A0D3F] text-white'
                    : 'bg-white border border-[#EFE3E9] text-[#4E2A3E] hover:border-[#5A0D3F]'
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Filter */}
      {availableColors.length > 0 && (
        <div className="pt-5 border-t border-[#EFE3E9]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5A0D3F] mb-3">
            Colour
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              const active = selectedColors.includes(color.name);
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => toggleColor(color.name)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border transition-colors ${
                    active
                      ? 'border-[#5A0D3F] bg-[#F8EEF2] font-semibold text-[#5A0D3F]'
                      : 'border-[#E5D3DC] bg-white text-[#4E2A3E] hover:border-[#5A0D3F]'
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-black/15"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetAllFilters}
          className="w-full rounded-full border border-[#5A0D3F] py-2 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2] transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Category Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#F9EDF2] via-[#FDFBF9] to-[#F5E4EC] border border-[#EFE3E9] px-6 py-7 sm:px-9 sm:py-9 mb-8">
        <nav aria-label="Breadcrumb" className="text-xs text-[#7A5B6B] mb-2">
          <button
            type="button"
            onClick={() => onNavigate({ view: 'home' })}
            className="hover:text-[#5A0D3F] underline-offset-2 hover:underline"
          >
            Home
          </button>
          <span className="mx-2">/</span>
          <span className="font-medium text-[#5A0D3F]">{pageTitle}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#5A0D3F]">
              {pageTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#4E2A3E]">{pageDescription}</p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={onClearSearch}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D4B4C4] bg-white px-4 py-2 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
              >
                <X className="h-3.5 w-3.5" />
                <span>Clear Search</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#EFE3E9]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 rounded-full border border-[#D4B4C4] bg-white px-4 py-2 text-xs font-semibold text-[#5A0D3F]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>

          <p className="text-sm text-[#4E2A3E] tabular-nums">
            Showing <span className="font-semibold text-[#5A0D3F]">{filteredProducts.length}</span>{' '}
            {filteredProducts.length === 1 ? 'style' : 'styles'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label htmlFor="sort-select" className="text-xs font-medium text-[#7A5B6B]">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-full border border-[#E5D3DC] bg-white px-4 py-2 text-xs font-semibold text-[#2A1121] focus:border-[#5A0D3F] focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="popularity">Popularity</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-36 rounded-2xl bg-white p-5 border border-[#EFE3E9]">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#F4EAEF]">
              <Filter className="h-4 w-4 text-[#5A0D3F]" />
              <h2 className="font-sans text-sm font-semibold text-[#2A1121]">
                Filter Styles
              </h2>
            </div>
            {FilterPanel}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={wishlistIds.includes(product.id)}
                  onOpenProduct={(id) => onNavigate({ view: 'product', productId: id })}
                  onToggleWishlist={onToggleWishlist}
                  onAddToBag={onAddToBag}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-[#EFE3E9] px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F8EEF2] text-[#5A0D3F]">
                <Search className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-[#5A0D3F]">
                {searchQuery.trim()
                  ? `No styles matched "${searchQuery.trim()}"`
                  : 'No products match these filters'}
              </h2>
              <p className="mt-2 mx-auto max-w-md text-sm text-[#7A5B6B]">
                Try clearing a filter, checking spelling, or browsing one of our popular STARLITES
                collections below.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="rounded-full bg-[#5A0D3F] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554]"
                >
                  View All Products
                </button>
                {CATEGORIES.slice(0, 4).map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      onClearSearch();
                      onNavigate({ view: 'shop', category: cat.slug });
                    }}
                    className="rounded-full border border-[#E5D3DC] bg-white px-4 py-2 text-xs font-medium text-[#5A0D3F] hover:bg-[#F8EEF2]"
                  >
                    {cat.shortName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#2A1121]/45 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex w-[85%] max-w-sm flex-col bg-[#FDFBF9] h-full shadow-2xl overflow-y-auto p-5">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EFE3E9]">
              <h2 className="font-serif text-xl font-semibold text-[#5A0D3F]">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F8EEF2] text-[#5A0D3F]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {FilterPanel}
          </div>
        </div>
      )}
    </div>
  );
};
