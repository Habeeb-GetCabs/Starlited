import assert from 'node:assert/strict';
import test from 'node:test';
import { addItemToCart, removeCartItem, toggleWishlistId, updateCartItemQty } from './cartLogic.ts';
import {
  CATEGORIES,
  filterProducts,
  getPrimaryImage,
  getRelatedProducts,
  sortProducts,
} from './catalogLogic.ts';
import {
  buildOrderWhatsAppUrl,
  canCustomerCancelOrder,
  generateOrderCode,
  normalizeIndianPhone,
  validateCheckoutInput,
} from './orderLogic.ts';
import {
  FREE_SHIPPING_THRESHOLD_INR,
  STANDARD_SHIPPING_FEE_INR,
  calculateCartTotals,
  calculateDiscountPercent,
  formatINR,
} from './pricingLogic.ts';
import type { Product } from '../types/store.ts';

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: 'p1',
    slug: 'p1',
    name: 'Sample Top',
    category: 'tops-14-plus',
    description: 'Comfortable cotton everyday wear',
    fabricCare: '100% Cotton',
    sellingPrice: 599,
    originalPrice: 799,
    sizes: ['S', 'M', 'L'],
    colors: [{ name: 'Rose Pink', hex: '#C66B8E' }],
    status: 'active',
    isNewArrival: true,
    isBestSeller: false,
    popularityScore: 80,
    createdAt: '2026-01-10T10:00:00.000Z',
    images: [{ id: 'img1', source: 'asset', assetKey: 'cat_tops_14plus', isPrimary: true }],
    ...overrides,
  };
}

test('pricingLogic computes discount percentage, INR formatting, and free shipping threshold', () => {
  assert.equal(calculateDiscountPercent(599, 799), 25);
  assert.equal(calculateDiscountPercent(1000, 1000), 0);
  assert.equal(calculateDiscountPercent(500, 0), 0);
  assert.equal(formatINR(1599), '₹1,599');

  const p1 = makeProduct({ id: 'p1', sellingPrice: 599 });
  const p2 = makeProduct({ id: 'p2', sellingPrice: 499 });
  const byId = { p1, p2 };

  const belowFree = calculateCartTotals(
    [{ key: 'p1__M__Rose', productId: 'p1', size: 'M', colorName: 'Rose', colorHex: '#C66B8E', quantity: 1, addedAt: '2026-01-01' }],
    byId
  );
  assert.equal(belowFree.subtotal, 599);
  assert.equal(belowFree.shippingFee, STANDARD_SHIPPING_FEE_INR);
  assert.equal(belowFree.grandTotal, 599 + STANDARD_SHIPPING_FEE_INR);
  assert.equal(belowFree.amountToFreeShipping, FREE_SHIPPING_THRESHOLD_INR - 599);

  const aboveFree = calculateCartTotals(
    [
      { key: 'p1__M__Rose', productId: 'p1', size: 'M', colorName: 'Rose', colorHex: '#C66B8E', quantity: 1, addedAt: '2026-01-01' },
      { key: 'p2__L__Plum', productId: 'p2', size: 'L', colorName: 'Plum', colorHex: '#5A0D3F', quantity: 1, addedAt: '2026-01-01' },
    ],
    byId
  );
  assert.equal(aboveFree.subtotal, 1098);
  assert.equal(aboveFree.shippingFee, 0);
  assert.equal(aboveFree.grandTotal, 1098);
  assert.equal(aboveFree.totalItems, 2);
});

test('catalogLogic defines all 9 required categories and filters accurately', () => {
  assert.equal(CATEGORIES.length, 9);
  const slugs = CATEGORIES.map((c) => c.slug);
  for (const expected of [
    'innerwear',
    'tops-14-plus',
    'two-piece-sets',
    'three-piece-sets',
    'nightwear-nighties',
    'pajamas',
    'maternity-wear',
    'umbrella-long-tops',
    'maxi-dresses',
  ]) {
    assert.ok(slugs.includes(expected as Product['category']), `Missing category ${expected}`);
  }

  const catalog: Product[] = [
    makeProduct({ id: 'a', name: 'Floral Top', category: 'tops-14-plus', sellingPrice: 599, sizes: ['S', 'M'] }),
    makeProduct({ id: 'b', name: 'Comfort Nightie', category: 'nightwear-nighties', sellingPrice: 899, sizes: ['L', 'XL'], colors: [{ name: 'Deep Plum', hex: '#5A0D3F' }] }),
    makeProduct({ id: 'c', name: 'Draft Item', category: 'maxi-dresses', status: 'draft', sellingPrice: 1299 }),
  ];

  const publicOnly = filterProducts(catalog, {
    category: 'all',
    query: '',
    sizes: [],
    colors: [],
    minPrice: null,
    maxPrice: null,
  });
  assert.equal(publicOnly.length, 2);

  const byQuery = filterProducts(catalog, {
    category: 'all',
    query: 'nightie',
    sizes: [],
    colors: [],
    minPrice: null,
    maxPrice: null,
  });
  assert.deepEqual(byQuery.map((p) => p.id), ['b']);

  const bySizeAndPrice = filterProducts(catalog, {
    category: 'all',
    query: '',
    sizes: ['L'],
    colors: ['Deep Plum'],
    minPrice: 800,
    maxPrice: 1000,
  });
  assert.deepEqual(bySizeAndPrice.map((p) => p.id), ['b']);
});

test('catalogLogic sorting, primary image selection, and related products work consistently', () => {
  const p1 = makeProduct({
    id: 'p1',
    sellingPrice: 999,
    popularityScore: 70,
    createdAt: '2026-01-01T00:00:00.000Z',
    images: [
      { id: 'i1', source: 'asset', assetKey: 'k1', isPrimary: false },
      { id: 'i2', source: 'asset', assetKey: 'k2', isPrimary: true },
    ],
  });
  const p2 = makeProduct({
    id: 'p2',
    sellingPrice: 499,
    popularityScore: 98,
    createdAt: '2026-02-01T00:00:00.000Z',
  });

  assert.equal(getPrimaryImage(p1)?.id, 'i2');
  assert.deepEqual(sortProducts([p1, p2], 'price-asc').map((p) => p.id), ['p2', 'p1']);
  assert.deepEqual(sortProducts([p1, p2], 'price-desc').map((p) => p.id), ['p1', 'p2']);
  assert.deepEqual(sortProducts([p1, p2], 'popularity').map((p) => p.id), ['p2', 'p1']);
  assert.deepEqual(sortProducts([p1, p2], 'newest').map((p) => p.id), ['p2', 'p1']);
  assert.deepEqual(getRelatedProducts([p1, p2], p1, 4).map((p) => p.id), ['p2']);
});

test('cartLogic merges identical variant lines, increments/decrements, and toggles wishlist', () => {
  let cart = addItemToCart([], {
    productId: 'p1',
    size: 'M',
    colorName: 'Rose Pink',
    colorHex: '#C66B8E',
    quantity: 1,
  });
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 1);

  cart = addItemToCart(cart, {
    productId: 'p1',
    size: 'M',
    colorName: 'Rose Pink',
    colorHex: '#C66B8E',
    quantity: 2,
  });
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 3);

  cart = addItemToCart(cart, {
    productId: 'p1',
    size: 'L',
    colorName: 'Rose Pink',
    colorHex: '#C66B8E',
    quantity: 1,
  });
  assert.equal(cart.length, 2);

  cart = updateCartItemQty(cart, cart[0].key, -3);
  assert.equal(cart.length, 1);

  cart = removeCartItem(cart, cart[0].key);
  assert.equal(cart.length, 0);

  const w1 = toggleWishlistId([], 'p1');
  assert.deepEqual(w1, ['p1']);
  const w2 = toggleWishlistId(w1, 'p1');
  assert.deepEqual(w2, []);
});

test('orderLogic validates checkout input, normalizes phone, generates order codes, and builds WhatsApp links', () => {
  const code = generateOrderCode(new Date('2026-11-12T12:00:00.000Z'));
  assert.match(code, /^SL-\d{6}-[A-Z0-9]{4}$/);

  assert.equal(normalizeIndianPhone('+91 88077-32182'), '8807732182');

  const invalidPhone = validateCheckoutInput({
    customerName: 'Ananya',
    phone: '12345',
    address: '12 Main Street',
    city: 'Tiruchirappalli',
    pincode: '620017',
    notes: '',
    paymentMethod: 'cod',
    itemCount: 1,
  });
  assert.equal(invalidPhone.valid, false);

  const valid = validateCheckoutInput({
    customerName: 'Ananya Krishnan',
    phone: '9876543210',
    address: '12 Anna Nagar Main Road',
    city: 'Tiruchirappalli, Tamil Nadu',
    pincode: '620017',
    notes: 'Call before delivery',
    paymentMethod: 'upi_manual',
    itemCount: 2,
  });
  assert.equal(valid.valid, true);

  assert.equal(canCustomerCancelOrder('pending'), true);
  assert.equal(canCustomerCancelOrder('confirmed'), false);
  assert.equal(canCustomerCancelOrder('delivered'), false);

  const waUrl = buildOrderWhatsAppUrl({
    orderCode: 'SL-261112-AB12',
    customerName: 'Ananya',
    phone: '9876543210',
    address: '12 Anna Nagar',
    city: 'Trichy',
    pincode: '620017',
    paymentMethod: 'cod',
    grandTotal: 1099,
    items: [
      {
        productName: 'Botanical Cotton 2-Piece Set',
        size: 'M',
        colorName: 'Blush Rose',
        quantity: 1,
        lineTotal: 1099,
      },
    ],
  });
  assert.ok(waUrl.startsWith('https://wa.me/918807732182?text='));
  assert.ok(decodeURIComponent(waUrl).includes('SL-261112-AB12'));
});
