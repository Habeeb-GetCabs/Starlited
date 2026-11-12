import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  calculateDiscountPercent,
  formatINR,
  FREE_SHIPPING_THRESHOLD_INR,
  STANDARD_SHIPPING_FEE_INR,
} from './pricingLogic';
import {
  CATEGORIES,
  filterProducts,
  getRelatedProducts,
  sortProducts,
} from './catalogLogic';
import {
  addItemToCart,
  removeCartItem,
  toggleWishlistId,
  updateCartItemQty,
} from './cartLogic';
import type { Product } from '../types/store';

const sampleProducts: Product[] = [
  {
    id: 'p1',
    slug: 'floral-top',
    name: 'Floral Everyday Top',
    category: 'tops-14-plus',
    description: 'Soft breathable cotton floral top',
    fabricCare: '100% Cotton',
    sellingPrice: 599,
    originalPrice: 799,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Rose Pink', hex: '#D47B96' }],
    status: 'active',
    isNewArrival: true,
    isBestSeller: false,
    popularityScore: 92,
    createdAt: '2026-10-10T10:00:00Z',
    images: [{ id: 'i1', source: 'asset', assetKey: 'cat_tops_14plus', isPrimary: true }],
  },
  {
    id: 'p2',
    slug: 'pastel-coord',
    name: 'Pastel Co-ord Set',
    category: 'two-piece-sets',
    description: 'Relaxed lavender 2-piece set',
    fabricCare: 'Cotton Linen',
    sellingPrice: 1099,
    originalPrice: 1499,
    sizes: ['M', 'L', 'XL'],
    colors: [
      { name: 'Lavender', hex: '#B99FD2' },
      { name: 'Plum', hex: '#5A0D3F' },
    ],
    status: 'active',
    isNewArrival: true,
    isBestSeller: true,
    popularityScore: 98,
    createdAt: '2026-10-12T10:00:00Z',
    images: [{ id: 'i2', source: 'asset', assetKey: 'cat_two_piece_sets', isPrimary: true }],
  },
  {
    id: 'p3',
    slug: 'draft-item',
    name: 'Hidden Draft Kurti',
    category: 'tops-14-plus',
    description: 'Draft item',
    fabricCare: 'Cotton',
    sellingPrice: 899,
    originalPrice: 999,
    sizes: ['S'],
    colors: [{ name: 'Ivory', hex: '#FDFBF9' }],
    status: 'draft',
    isNewArrival: false,
    isBestSeller: false,
    popularityScore: 10,
    createdAt: '2026-10-14T10:00:00Z',
    images: [],
  },
];

test('discount calculation and INR formatting', () => {
  assert.equal(calculateDiscountPercent(599, 799), 25);
  assert.equal(calculateDiscountPercent(999, 999), 0);
  assert.equal(calculateDiscountPercent(1200, 999), 0);
  assert.equal(formatINR(1599), '₹1,599');
});

test('all 9 requested categories are configured', () => {
  assert.equal(CATEGORIES.length, 9);
});

test('catalog filtering hides drafts by default and matches query, category, size, color, price', () => {
  const activeOnly = filterProducts(sampleProducts, {
    category: 'all',
    query: '',
    sizes: [],
    colors: [],
    minPrice: null,
    maxPrice: null,
  });
  assert.equal(activeOnly.length, 2);

  const searchTwoPiece = filterProducts(sampleProducts, {
    category: 'all',
    query: 'lavender',
    sizes: [],
    colors: [],
    minPrice: null,
    maxPrice: null,
  });
  assert.deepEqual(
    searchTwoPiece.map((p) => p.id),
    ['p2']
  );

  const bySizeAndPrice = filterProducts(sampleProducts, {
    category: 'all',
    query: '',
    sizes: ['S'],
    colors: [],
    minPrice: 400,
    maxPrice: 700,
  });
  assert.deepEqual(
    bySizeAndPrice.map((p) => p.id),
    ['p1']
  );

  const byColor = filterProducts(sampleProducts, {
    category: 'all',
    query: '',
    sizes: [],
    colors: ['Plum'],
    minPrice: null,
    maxPrice: null,
  });
  assert.deepEqual(
    byColor.map((p) => p.id),
    ['p2']
  );
});

test('catalog sorting orders properly', () => {
  const byPriceAsc = sortProducts(sampleProducts.slice(0, 2), 'price-asc');
  assert.deepEqual(
    byPriceAsc.map((p) => p.id),
    ['p1', 'p2']
  );

  const byPriceDesc = sortProducts(sampleProducts.slice(0, 2), 'price-desc');
  assert.deepEqual(
    byPriceDesc.map((p) => p.id),
    ['p2', 'p1']
  );

  const byNewest = sortProducts(sampleProducts.slice(0, 2), 'newest');
  assert.deepEqual(
    byNewest.map((p) => p.id),
    ['p2', 'p1']
  );
});

test('cart add, quantity increment/decrement, remove, and free shipping calculation', () => {
  const productsById = Object.fromEntries(sampleProducts.map((p) => [p.id, p]));
  let cart = addItemToCart([], {
    productId: 'p1',
    size: 'M',
    colorName: 'Rose Pink',
    colorHex: '#D47B96',
    quantity: 1,
  });
  assert.equal(cart.length, 1);

  // Adding same product + size + color increments quantity
  cart = addItemToCart(cart, {
    productId: 'p1',
    size: 'M',
    colorName: 'Rose Pink',
    colorHex: '#D47B96',
    quantity: 1,
  });
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 2);

  // Totals above 999 qualify for free shipping (599 * 2 = 1198)
  const totalsFree = calculateCartTotals(cart, productsById);
  assert.equal(totalsFree.subtotal, 1198);
  assert.equal(totalsFree.qualifiesForFreeShipping, true);
  assert.equal(totalsFree.shippingFee, 0);
  assert.equal(totalsFree.totalSavings, 400);

  // Decrement to 1 -> subtotal 599 -> below 999 -> shipping fee applies
  cart = updateCartItemQty(cart, cart[0].key, -1);
  const totalsPaidShip = calculateCartTotals(cart, productsById);
  assert.equal(totalsPaidShip.subtotal, 599);
  assert.equal(totalsPaidShip.qualifiesForFreeShipping, false);
  assert.equal(totalsPaidShip.shippingFee, STANDARD_SHIPPING_FEE_INR);
  assert.equal(totalsPaidShip.amountToFreeShipping, FREE_SHIPPING_THRESHOLD_INR - 599);

  // Different size creates distinct line item
  cart = addItemToCart(cart, {
    productId: 'p1',
    size: 'L',
    colorName: 'Rose Pink',
    colorHex: '#D47B96',
    quantity: 1,
  });
  assert.equal(cart.length, 2);

  cart = removeCartItem(cart, cart[0].key);
  assert.equal(cart.length, 1);
});

test('wishlist toggle and related products', () => {
  let wishlist = toggleWishlistId([], 'p1');
  assert.deepEqual(wishlist, ['p1']);
  wishlist = toggleWishlistId(wishlist, 'p2');
  assert.deepEqual(wishlist, ['p2', 'p1']);
  wishlist = toggleWishlistId(wishlist, 'p1');
  assert.deepEqual(wishlist, ['p2']);

  const related = getRelatedProducts(sampleProducts, sampleProducts[0], 4);
  assert.deepEqual(
    related.map((p) => p.id),
    ['p2']
  );
});
