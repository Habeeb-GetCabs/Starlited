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

export type OrderPaymentMethod = 'cod' | 'upi_manual';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductImageRef {
  id: string;
  source: 'asset' | 'indexeddb' | 'firestore_media' | 'url';
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
  updatedAt?: string;
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

export interface OrderItem {
  id: string;
  orderId: string;
  customerUid: string | null;
  productId: string;
  productName: string;
  size: ProductSize;
  colorName: string;
  colorHex: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderCode: string;
  isGuest: boolean;
  customerUid: string | null;
  customerEmail: string | null;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  notes: string;
  paymentMethod: OrderPaymentMethod;
  status: OrderStatus;
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface OrderTrackingInfo {
  orderId: string;
  orderCode: string;
  status: OrderStatus;
  paymentMethod: OrderPaymentMethod;
  itemCount: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName?: string;
  email: string;
  phone?: string;
  defaultAddress?: string;
  defaultCity?: string;
  defaultPincode?: string;
  createdAt: string;
  updatedAt: string;
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
  | { view: 'orders'; orderCode?: string }
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
