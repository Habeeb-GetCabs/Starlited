export type CategorySlug =
  | 'innerwear'
  | 'tops-14-plus'
  | 'two-piece-sets'
  | 'three-piece-sets'
  | 'nightwear-nighties'
  | 'pajamas'
  | 'maternity-wear'
  | 'umbrella-long-tops'
  | 'maxi-dresses';

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Free Size';

export type ProductStatus = 'active' | 'draft' | 'out_of_stock';

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popularity';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductImageRef {
  id: string;
  source: 'asset' | 'indexeddb' | 'url';
  assetKey?: string;
  url?: string;
  isPrimary: boolean;
  alt?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  description: string;
  fabricCare: string;
  sellingPrice: number;
  originalPrice: number;
  sizes: ProductSize[];
  colors: ProductColor[];
  status: ProductStatus;
  isNewArrival: boolean;
  isBestSeller: boolean;
  popularityScore: number;
  createdAt: string;
  images: ProductImageRef[];
}

export interface CategoryInfo {
  slug: CategorySlug;
  name: string;
  shortName: string;
  subtitle?: string;
  description: string;
  assetKey: string;
}

export interface CartItem {
  key: string;
  productId: string;
  size: ProductSize;
  colorName: string;
  colorHex: string;
  quantity: number;
  addedAt: string;
}

export interface ProductFilterState {
  category: CategorySlug | 'all';
  query: string;
  sizes: ProductSize[];
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
  onlyNewArrivals?: boolean;
  onlyBestSellers?: boolean;
  includeNonActive?: boolean;
}

export type AppRoute =
  | { view: 'home' }
  | { view: 'shop'; category?: CategorySlug | 'all'; collection?: 'new' | 'best'; query?: string }
  | { view: 'product'; productId: string }
  | { view: 'checkout' }
  | { view: 'admin' }
  | {
      view: 'info';
      page:
        | 'story'
        | 'size-guide'
        | 'care'
        | 'shipping'
        | 'returns'
        | 'privacy'
        | 'terms'
        | 'faq'
        | 'contact';
    };
