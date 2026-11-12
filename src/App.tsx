import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountDemoModal } from './components/AccountDemoModal';
import { AdminPage } from './components/AdminPage';
import { CartDrawer } from './components/CartDrawer';
import { CatalogPage } from './components/CatalogPage';
import { CheckoutDemoPage } from './components/CheckoutDemoPage';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { InfoPages } from './components/InfoPages';
import { ProductDetailsPage } from './components/ProductDetailsPage';
import { WishlistDrawer } from './components/WishlistDrawer';
import {
  addItemToCart,
  removeCartItem,
  toggleWishlistId,
  updateCartItemQty,
} from './services/cartLogic';
import { loadCart, saveCart } from './services/cartService';
import {
  loadProducts,
  removeProductById,
  resetCatalogToDefaults,
  upsertProduct,
} from './services/productService';
import { loadWishlist, saveWishlist } from './services/wishlistService';
import type { AppRoute, CartItem, Product, ProductSize } from './types/store';

function parseRouteFromHash(): AppRoute {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw || raw === '/') return { view: 'home' };
  if (raw === '/admin') return { view: 'admin' };
  if (raw === '/checkout') return { view: 'checkout' };
  if (raw.startsWith('/product/')) {
    return { view: 'product', productId: decodeURIComponent(raw.slice('/product/'.length)) };
  }
  if (raw.startsWith('/category/')) {
    const slug = raw.slice('/category/'.length) as AppRoute extends { category?: infer C }
      ? NonNullable<C>
      : never;
    return { view: 'shop', category: slug };
  }
  if (raw.startsWith('/shop')) {
    const [, queryPart] = raw.split('?');
    const params = new URLSearchParams(queryPart ?? '');
    const collection = params.get('collection');
    const q = params.get('q') ?? undefined;
    return {
      view: 'shop',
      category: 'all',
      collection: collection === 'new' || collection === 'best' ? collection : undefined,
      query: q,
    };
  }
  if (raw.startsWith('/info/')) {
    const page = raw.slice('/info/'.length) as Extract<AppRoute, { view: 'info' }>['page'];
    return { view: 'info', page };
  }
  return { view: 'home' };
}

function serializeRouteToHash(route: AppRoute): string {
  switch (route.view) {
    case 'home':
      return '#/';
    case 'admin':
      return '#/admin';
    case 'checkout':
      return '#/checkout';
    case 'product':
      return `#/product/${encodeURIComponent(route.productId)}`;
    case 'info':
      return `#/info/${route.page}`;
    case 'shop': {
      if (route.category && route.category !== 'all') {
        return `#/category/${route.category}`;
      }
      const params = new URLSearchParams();
      if (route.collection) params.set('collection', route.collection);
      if (route.query) params.set('q', route.query);
      const qs = params.toString();
      return qs ? `#/shop?${qs}` : '#/shop';
    }
  }
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCart());
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => loadWishlist());
  const [route, setRoute] = useState<AppRoute>(() => {
    // Support both #/admin and /admin path entry
    if (window.location.pathname === '/admin') return { view: 'admin' };
    return parseRouteFromHash();
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // Sync hash changes (browser back/forward)
  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRouteFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Persist cart & wishlist
  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    saveWishlist(wishlistIds);
  }, [wishlistIds]);

  const productsById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products]
  );

  const totalCartItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const navigate = useCallback((nextRoute: AppRoute) => {
    setRoute(nextRoute);
    const nextHash = serializeRouteToHash(nextRoute);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      navigate({ view: 'shop', category: 'all', query });
    },
    [navigate]
  );

  const handleToggleWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) => toggleWishlistId(prev, productId));
  }, []);

  const handleAddToBag = useCallback(
    (params: {
      productId: string;
      size: ProductSize;
      colorName: string;
      colorHex: string;
      quantity?: number;
    }) => {
      setCartItems((prev) => addItemToCart(prev, params));
    },
    []
  );

  const handleUpdateCartQty = useCallback((key: string, delta: number) => {
    setCartItems((prev) => updateCartItemQty(prev, key, delta));
  }, []);

  const handleRemoveCartItem = useCallback((key: string) => {
    setCartItems((prev) => removeCartItem(prev, key));
  }, []);

  const handleSaveProduct = useCallback((product: Product) => {
    setProducts((prev) => upsertProduct(prev, product));
  }, []);

  const handleDeleteProduct = useCallback((productId: string) => {
    setProducts((prev) => removeProductById(prev, productId));
  }, []);

  const handleResetCatalog = useCallback(() => {
    setProducts(resetCatalogToDefaults());
  }, []);

  const currentSearchQuery = route.view === 'shop' ? route.query ?? '' : '';

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF9] text-[#2A1121]">
      <Header
        currentRoute={route}
        searchQuery={currentSearchQuery}
        wishlistCount={wishlistIds.length}
        cartCount={totalCartItems}
        onNavigate={navigate}
        onSearchSubmit={handleSearchSubmit}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
      />

      <main className="flex-1">
        {route.view === 'home' && (
          <HomePage
            products={products}
            wishlistIds={wishlistIds}
            onNavigate={navigate}
            onToggleWishlist={handleToggleWishlist}
            onAddToBag={(params) => handleAddToBag({ ...params, quantity: 1 })}
          />
        )}

        {route.view === 'shop' && (
          <CatalogPage
            products={products}
            wishlistIds={wishlistIds}
            initialCategory={route.category ?? 'all'}
            collection={route.collection}
            searchQuery={route.query ?? ''}
            onNavigate={navigate}
            onClearSearch={() => navigate({ view: 'shop', category: route.category ?? 'all' })}
            onToggleWishlist={handleToggleWishlist}
            onAddToBag={(params) => handleAddToBag({ ...params, quantity: 1 })}
          />
        )}

        {route.view === 'product' && (
          <ProductDetailsPage
            product={productsById[route.productId]}
            allProducts={products}
            wishlistIds={wishlistIds}
            onNavigate={navigate}
            onToggleWishlist={handleToggleWishlist}
            onAddToBag={handleAddToBag}
          />
        )}

        {route.view === 'checkout' && (
          <CheckoutDemoPage
            items={cartItems}
            productsById={productsById}
            onNavigate={navigate}
          />
        )}

        {route.view === 'admin' && (
          <AdminPage
            products={products}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onResetCatalog={handleResetCatalog}
            onNavigate={navigate}
          />
        )}

        {route.view === 'info' && <InfoPages page={route.page} onNavigate={navigate} />}
      </main>

      <Footer onNavigate={navigate} />

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        productsById={productsById}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onOpenProduct={(id) => navigate({ view: 'product', productId: id })}
        onProceedToCheckout={() => navigate({ view: 'checkout' })}
      />

      <WishlistDrawer
        open={wishlistOpen}
        wishlistIds={wishlistIds}
        productsById={productsById}
        onClose={() => setWishlistOpen(false)}
        onRemoveWishlist={handleToggleWishlist}
        onOpenProduct={(id) => navigate({ view: 'product', productId: id })}
        onMoveToBag={(params) => {
          handleAddToBag({ ...params, quantity: 1 });
          setWishlistOpen(false);
          setCartOpen(true);
        }}
      />

      <AccountDemoModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onNavigate={navigate}
      />
    </div>
  );
}
