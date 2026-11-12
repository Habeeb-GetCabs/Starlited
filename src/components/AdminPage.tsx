import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CloudUpload,
  Edit3,
  ImagePlus,
  Link2,
  LogIn,
  LogOut,
  MessageCircle,
  Package,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { signInWithGoogle, signOutUser, type AuthSessionState } from '../services/authService';
import { CATEGORIES, getCategoryLabel, getPrimaryImage } from '../services/catalogLogic';
import { deleteImageFile, saveImageFile } from '../services/imageStorageService';
import { ORDER_STATUS_LABELS } from '../services/orderLogic';
import {
  fetchOrderItems,
  subscribeAdminOrders,
  updateOrderStatusAdmin,
} from '../services/orderService';
import { calculateDiscountPercent, formatINR } from '../services/pricingLogic';
import {
  deleteProductFromCloud,
  saveProductToCloud,
  seedDefaultCatalogToCloud,
} from '../services/productService';
import type {
  AppRoute,
  CategorySlug,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductColor,
  ProductImageRef,
  ProductSize,
  ProductStatus,
} from '../types/store';
import { ResolvedImage } from './ResolvedImage';

interface AdminPageProps {
  products: Product[];
  isCloudCatalog: boolean;
  authState: AuthSessionState;
  onSaveProductLocal: (product: Product) => void;
  onDeleteProductLocal: (productId: string) => void;
  onResetCatalogLocal: () => void;
  onNavigate: (route: AppRoute) => void;
}

const ALL_SIZES: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const ALL_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
];

const ORDER_STATUS_BADGES: Record<OrderStatus, string> = {
  pending: 'bg-[#FDF4E6] text-[#8C5B12]',
  confirmed: 'bg-[#F8EEF2] text-[#5A0D3F]',
  packed: 'bg-[#EDE9F7] text-[#46297A]',
  shipped: 'bg-[#E6F2FA] text-[#1A557D]',
  delivered: 'bg-[#EEF7F1] text-[#21593A]',
  cancelled: 'bg-[#FDF0F3] text-[#A81D63]',
};

const PRESET_COLORS: ProductColor[] = [
  { name: 'Deep Plum', hex: '#5A0D3F' },
  { name: 'Rose Pink', hex: '#D47B96' },
  { name: 'Soft Lavender', hex: '#B99FD2' },
  { name: 'Warm Ivory', hex: '#EFE5DC' },
  { name: 'Wine Maroon', hex: '#63222F' },
  { name: 'Midnight Navy', hex: '#28324E' },
  { name: 'Ochre Mustard', hex: '#C98A3A' },
  { name: 'Dusty Rose', hex: '#C7928E' },
];

interface FormState {
  id: string | null;
  name: string;
  category: CategorySlug;
  description: string;
  fabricCare: string;
  sellingPrice: string;
  originalPrice: string;
  sizes: ProductSize[];
  colors: ProductColor[];
  status: ProductStatus;
  isNewArrival: boolean;
  isBestSeller: boolean;
  images: ProductImageRef[];
  createdAt?: string;
  popularityScore?: number;
}

function createEmptyForm(): FormState {
  return {
    id: null,
    name: '',
    category: 'tops-14-plus',
    description: '',
    fabricCare: '100% Pure Cotton · Gentle cold wash',
    sellingPrice: '799',
    originalPrice: '999',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Deep Plum', hex: '#5A0D3F' }],
    status: 'active',
    isNewArrival: true,
    isBestSeller: false,
    images: [],
  };
}

export const AdminPage: React.FC<AdminPageProps> = ({
  products,
  isCloudCatalog,
  authState,
  onSaveProductLocal,
  onDeleteProductLocal,
  onResetCatalogLocal,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [form, setForm] = useState<FormState>(createEmptyForm);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<CategorySlug | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [seedingCloud, setSeedingCloud] = useState(false);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#8C1D5E');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null);

  // Orders Tab State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilterStatus, setOrderFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  const multiFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!authState.ready || !authState.isAdmin) {
      setOrders([]);
      return;
    }
    const unsub = subscribeAdminOrders(
      (list) => setOrders(list),
      (err) => setStatusMessage(`Order sync notice: ${err.message}`)
    );
    return () => unsub();
  }, [authState.ready, authState.isAdmin]);

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return products.filter((p) => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !getCategoryLabel(p.category).toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [products, filterCategory, searchText]);

  const filteredOrders = useMemo(() => {
    if (orderFilterStatus === 'all') return orders;
    return orders.filter((o) => o.status === orderFilterStatus);
  }, [orders, orderFilterStatus]);

  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'pending').length,
    [orders]
  );

  const sellingNum = Number(form.sellingPrice) || 0;
  const originalNum = Number(form.originalPrice) || 0;
  const discountPreview = calculateDiscountPercent(sellingNum, originalNum);

  const handleAdminSignIn = async () => {
    setAuthBusy(true);
    setAuthError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(msg);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  // Gate Admin UI unless verified Admin is signed in
  if (!authState.ready) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm text-[#7A5B6B]">Checking store owner session...</p>
      </div>
    );
  }

  if (!authState.user || !authState.isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14 sm:py-20">
        <button
          type="button"
          onClick={() => onNavigate({ view: 'home' })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A0D3F] hover:underline mb-5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Customer Storefront</span>
        </button>

        <div className="rounded-3xl bg-white p-7 sm:p-9 border border-[#EFE3E9] shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F8EEF2] text-[#5A0D3F]">
            {authState.user ? (
              <ShieldAlert className="h-6 w-6 text-[#A81D63]" />
            ) : (
              <ShieldCheck className="h-6 w-6" />
            )}
          </div>

          <h1 className="mt-4 font-serif text-2xl sm:text-3xl font-semibold text-[#5A0D3F]">
            Store Owner Portal
          </h1>

          {authState.user ? (
            <>
              <p className="mt-2 text-xs sm:text-sm text-[#4E2A3E]">
                Signed in as <strong>{authState.user.email}</strong>, which is not authorized as a
                STARLITES CLOTHING store administrator.
              </p>
              <button
                type="button"
                disabled={authBusy}
                onClick={() => signOutUser()}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#5A0D3F] px-6 py-2.5 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out &amp; Switch Account</span>
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 text-xs sm:text-sm text-[#7A5B6B]">
                Sign in with your authorized Store Owner Google account to upload dress photos,
                manage prices, and fulfill customer orders.
              </p>

              {authError && (
                <p className="mt-4 rounded-xl bg-[#FDF0F3] border border-[#E7B5C6] px-4 py-2.5 text-xs text-[#8C1D5E]">
                  {authError}
                </p>
              )}

              <button
                type="button"
                disabled={authBusy}
                onClick={handleAdminSignIn}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#5A0D3F] px-7 py-3 text-xs font-semibold text-white hover:bg-[#7A1554] disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                <span>{authBusy ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const openNewProductForm = () => {
    setForm(createEmptyForm());
    setFormError('');
    setShowForm(true);
  };

  const openEditProductForm = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      fabricCare: product.fabricCare,
      sellingPrice: String(product.sellingPrice),
      originalPrice: String(product.originalPrice),
      sizes: [...product.sizes],
      colors: [...product.colors],
      status: product.status,
      isNewArrival: product.isNewArrival,
      isBestSeller: product.isBestSeller,
      images: [...product.images],
      createdAt: product.createdAt,
      popularityScore: product.popularityScore,
    });
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingImages(true);
    setFormError('');

    try {
      const uploadedRefs: ProductImageRef[] = [];
      for (const file of files) {
        const saved = await saveImageFile(file);
        uploadedRefs.push({
          id: saved.id,
          source: saved.source,
          isPrimary: false,
          alt: form.name.trim() || file.name.slice(0, 120),
        });
      }

      setForm((prev) => {
        const combined = [...prev.images, ...uploadedRefs].slice(0, 10);
        if (!combined.some((img) => img.isPrimary) && combined.length > 0) {
          combined[0] = { ...combined[0], isPrimary: true };
        }
        return { ...prev, images: combined };
      });
    } catch {
      setFormError('Could not upload one or more images to cloud media storage.');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleReplaceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = replacingImageId;
    if (!file || !targetId) return;

    setUploadingImages(true);
    try {
      const saved = await saveImageFile(file);
      const oldImg = form.images.find((img) => img.id === targetId);
      if (oldImg && (oldImg.source === 'indexeddb' || oldImg.source === 'firestore_media')) {
        await deleteImageFile(oldImg.id, oldImg.source);
      }
      setForm((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === targetId
            ? {
                id: saved.id,
                source: saved.source,
                isPrimary: img.isPrimary,
                alt: form.name.trim() || file.name.slice(0, 120),
              }
            : img
        ),
      }));
    } catch {
      setFormError('Failed to replace uploaded image.');
    } finally {
      setUploadingImages(false);
      setReplacingImageId(null);
      e.target.value = '';
    }
  };

  const handleAddExternalImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      setFormError('Please enter a valid https:// image URL.');
      return;
    }
    setFormError('');
    setForm((prev) => {
      const nextImg: ProductImageRef = {
        id: `url_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        source: 'url',
        url,
        isPrimary: prev.images.length === 0,
        alt: prev.name.trim() || 'Product photo',
      };
      return { ...prev, images: [...prev.images, nextImg].slice(0, 10) };
    });
    setImageUrlInput('');
  };

  const handleSetPrimaryImage = (imageId: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      })),
    }));
  };

  const handleRemoveImage = async (imageId: string) => {
    const target = form.images.find((img) => img.id === imageId);
    if (target && (target.source === 'indexeddb' || target.source === 'firestore_media')) {
      await deleteImageFile(target.id, target.source);
    }
    setForm((prev) => {
      const remaining = prev.images.filter((img) => img.id !== imageId);
      if (remaining.length > 0 && !remaining.some((img) => img.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return { ...prev, images: remaining };
    });
  };

  const toggleSize = (size: ProductSize) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const togglePresetColor = (color: ProductColor) => {
    setForm((prev) => {
      const exists = prev.colors.some((c) => c.name === color.name);
      return {
        ...prev,
        colors: exists
          ? prev.colors.filter((c) => c.name !== color.name)
          : [...prev.colors, color],
      };
    });
  };

  const handleAddCustomColor = () => {
    const trimmed = customColorName.trim();
    if (!trimmed) return;
    if (form.colors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setCustomColorName('');
      return;
    }
    setForm((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: trimmed, hex: customColorHex }],
    }));
    setCustomColorName('');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setFormError('Please enter a product name (at least 2 characters).');
      return;
    }
    if (!form.description.trim()) {
      setFormError('Please enter a product description.');
      return;
    }
    if (sellingNum <= 0 || originalNum <= 0) {
      setFormError('Please enter valid selling and original prices in ₹.');
      return;
    }
    if (form.sizes.length === 0) {
      setFormError('Please select at least one available size.');
      return;
    }

    const slug = form.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const isNew = !form.id;
    const saved: Product = {
      id: form.id ?? `sl-custom-${Date.now()}`,
      slug: slug || `product-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      fabricCare: form.fabricCare.trim() || '100% Pure Cotton · Gentle wash',
      sellingPrice: Math.round(sellingNum),
      originalPrice: Math.round(Math.max(originalNum, sellingNum)),
      sizes: form.sizes,
      colors: form.colors.length > 0 ? form.colors : [{ name: 'Signature', hex: '#5A0D3F' }],
      status: form.status,
      isNewArrival: form.isNewArrival,
      isBestSeller: form.isBestSeller,
      popularityScore: form.popularityScore ?? 90,
      createdAt: form.createdAt ?? new Date().toISOString(),
      images:
        form.images.length > 0
          ? form.images
          : [{ id: `default_${Date.now()}`, source: 'asset', assetKey: 'cat_tops_14plus', isPrimary: true }],
    };

    setSavingProduct(true);
    setFormError('');
    try {
      await saveProductToCloud(saved, isNew);
      onSaveProductLocal(saved);
      setShowForm(false);
      setForm(createEmptyForm());
      setStatusMessage(`Saved "${saved.name}" to the live cloud catalog.`);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save product to Firestore.'
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const handleQuickStatusToggle = async (product: Product) => {
    const nextStatus: ProductStatus =
      product.status === 'active'
        ? 'out_of_stock'
        : product.status === 'out_of_stock'
        ? 'draft'
        : 'active';
    const updated = { ...product, status: nextStatus };
    await saveProductToCloud(updated, false);
    onSaveProductLocal(updated);
    setStatusMessage(`Updated status of "${product.name}" to ${nextStatus.replace('_', ' ')}.`);
  };

  const handleConfirmDelete = async (product: Product) => {
    for (const img of product.images) {
      if (img.source === 'indexeddb' || img.source === 'firestore_media') {
        await deleteImageFile(img.id, img.source);
      }
    }
    await deleteProductFromCloud(product.id);
    onDeleteProductLocal(product.id);
    setConfirmDeleteId(null);
    setStatusMessage(`Deleted "${product.name}" from the cloud catalog.`);
  };

  const handleSeedCloudCatalog = async (overwrite: boolean) => {
    setSeedingCloud(true);
    try {
      const count = await seedDefaultCatalogToCloud(overwrite);
      onResetCatalogLocal();
      setStatusMessage(`Published ${count} starter styles to the shared cloud catalog.`);
    } finally {
      setSeedingCloud(false);
    }
  };

  const handleToggleOrderItems = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!orderItemsMap[orderId]) {
      const items = await fetchOrderItems(orderId);
      setOrderItemsMap((prev) => ({ ...prev, [orderId]: items }));
    }
  };

  const handleOrderStatusChange = async (order: Order, nextStatus: OrderStatus) => {
    setUpdatingOrderId(order.id);
    try {
      await updateOrderStatusAdmin(order.id, order.orderCode, nextStatus);
      setStatusMessage(`Order ${order.orderCode} updated to "${ORDER_STATUS_LABELS[nextStatus]}".`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#EFE3E9]">
        <div>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'home' })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A0D3F] hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Customer Storefront</span>
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl font-semibold text-[#5A0D3F]">
              Store Owner Portal
            </h1>
            <span className="rounded-full bg-[#EEF7F1] px-3 py-1 text-[11px] font-semibold text-[#21593A]">
              Cloud Synced · {authState.user.email}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#7A5B6B]">
            Upload real product photographs, manage pricing across all 9 categories, and process
            customer orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'products' && (
            <>
              <button
                type="button"
                disabled={seedingCloud}
                onClick={() => handleSeedCloudCatalog(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D4B4C4] bg-white px-4 py-2 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{seedingCloud ? 'Syncing...' : 'Seed / Reset Starter Catalog'}</span>
              </button>
              <button
                type="button"
                onClick={openNewProductForm}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#5A0D3F] px-5 py-2 text-xs font-semibold text-white hover:bg-[#7A1554]"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Product</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => signOutUser()}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5D3DC] bg-white px-4 py-2 text-xs font-medium text-[#4E2A3E] hover:bg-[#F8EEF2]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'products'
              ? 'bg-[#5A0D3F] text-white'
              : 'border border-[#E5D3DC] bg-white text-[#4E2A3E] hover:border-[#5A0D3F]'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Products &amp; Photos ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'orders'
              ? 'bg-[#5A0D3F] text-white'
              : 'border border-[#E5D3DC] bg-white text-[#4E2A3E] hover:border-[#5A0D3F]'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Customer Orders ({orders.length})</span>
          {pendingOrdersCount > 0 && (
            <span className="rounded-full bg-[#C59B48] px-2 py-0.5 text-[10px] font-bold text-white">
              {pendingOrdersCount} new
            </span>
          )}
        </button>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="mt-5 flex items-center justify-between rounded-2xl bg-[#EEF7F1] border border-[#BBDCC6] px-4 py-3 text-xs font-medium text-[#21593A]"
        >
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{statusMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'products' ? (
        <>
          {!isCloudCatalog && (
            <div className="mt-6 rounded-2xl border border-[#DFB968] bg-[#FDF7E8] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#563B0A]">
                  Your cloud Firestore catalog is currently empty
                </p>
                <p className="mt-0.5 text-xs text-[#6B4A10]">
                  Publish the 18 starter styles to Firestore so you can edit prices, upload your real
                  dress photos, and share them live with every visitor.
                </p>
              </div>
              <button
                type="button"
                disabled={seedingCloud}
                onClick={() => handleSeedCloudCatalog(false)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#5A0D3F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554]"
              >
                <CloudUpload className="h-4 w-4" />
                <span>{seedingCloud ? 'Publishing...' : 'Publish Starter Catalog to Cloud'}</span>
              </button>
            </div>
          )}

          {/* Add / Edit Product Form */}
          {showForm && (
            <form
              onSubmit={handleSaveForm}
              className="mt-6 rounded-3xl bg-white p-6 sm:p-8 border border-[#EFE3E9] shadow-sm space-y-6"
              noValidate
            >
              <div className="flex items-center justify-between border-b border-[#F4EAEF] pb-4">
                <h2 className="font-serif text-2xl font-semibold text-[#5A0D3F]">
                  {form.id ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs font-semibold text-[#7A5B6B] hover:text-[#5A0D3F]"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#E7B5C6] bg-[#FDF0F3] px-4 py-3 text-xs font-medium text-[#8C1D5E]"
                >
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="adm-name" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                    Product Name *
                  </label>
                  <input
                    id="adm-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., Rose Cotton Embroidered Kurti"
                    className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="adm-cat" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                    Category *
                  </label>
                  <select
                    id="adm-cat"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value as CategorySlug }))
                    }
                    className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="adm-desc" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                  Product Description *
                </label>
                <textarea
                  id="adm-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe silhouette, fabric feel, fit, and occasion..."
                  className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label htmlFor="adm-sell" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                    Selling Price (₹) *
                  </label>
                  <input
                    id="adm-sell"
                    type="number"
                    min={1}
                    value={form.sellingPrice}
                    onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))}
                    className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm tabular-nums focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="adm-orig" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                    Original Price (₹) *
                  </label>
                  <input
                    id="adm-orig"
                    type="number"
                    min={1}
                    value={form.originalPrice}
                    onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                    className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm tabular-nums focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <p className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                    Discount Preview
                  </p>
                  <div className="flex h-[42px] items-center rounded-xl border border-[#EFE3E9] bg-[#F8EEF2] px-4 text-sm font-bold text-[#8C1D5E] tabular-nums">
                    {discountPreview > 0 ? `${discountPreview}% OFF` : 'No Discount'}
                  </div>
                </div>

                <div>
                  <label htmlFor="adm-status" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                    Product Status
                  </label>
                  <select
                    id="adm-status"
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as ProductStatus }))
                    }
                    className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Sizes & Badges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-[#2A1121] mb-2">Available Sizes *</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SIZES.map((size) => {
                      const active = form.sizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            active
                              ? 'bg-[#5A0D3F] text-white'
                              : 'border border-[#E5D3DC] bg-white text-[#4E2A3E]'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#2A1121] mb-2">Merchandising Flags</p>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-2 rounded-xl border border-[#E5D3DC] px-4 py-2 text-xs font-medium text-[#2A1121] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isNewArrival}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, isNewArrival: e.target.checked }))
                        }
                        className="accent-[#5A0D3F]"
                      />
                      <span>New Arrival</span>
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-xl border border-[#E5D3DC] px-4 py-2 text-xs font-medium text-[#2A1121] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isBestSeller}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, isBestSeller: e.target.checked }))
                        }
                        className="accent-[#5A0D3F]"
                      />
                      <span>Best Seller</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Colours */}
              <div>
                <p className="text-xs font-semibold text-[#2A1121] mb-2">Available Colours</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((c) => {
                    const selected = form.colors.some((fc) => fc.name === c.name);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => togglePresetColor(c)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors ${
                          selected
                            ? 'border-[#5A0D3F] bg-[#F8EEF2] font-semibold text-[#5A0D3F]'
                            : 'border-[#E5D3DC] bg-white text-[#4E2A3E]'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-black/15"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={customColorName}
                    onChange={(e) => setCustomColorName(e.target.value)}
                    placeholder="Add custom colour name"
                    className="rounded-full border border-[#DFC9D4] bg-[#FDFBF9] px-3.5 py-1.5 text-xs focus:border-[#5A0D3F] focus:outline-none"
                  />
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    aria-label="Custom colour hex"
                    className="h-8 w-8 cursor-pointer rounded-full border border-[#DFC9D4]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="rounded-full border border-[#5A0D3F] px-3.5 py-1.5 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
                  >
                    + Add Colour
                  </button>
                </div>
              </div>

              {/* Multi-Image Upload & Management */}
              <div className="pt-4 border-t border-[#F4EAEF]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#5A0D3F]">
                      Product Photographs (Shared via Firestore Cloud Media)
                    </h3>
                    <p className="text-xs text-[#7A5B6B]">
                      Upload multiple photos from computer or phone. Automatically compressed and
                      shared with all storefront visitors.
                    </p>
                  </div>

                  <div>
                    <input
                      ref={multiFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultiImageUpload}
                      className="hidden"
                    />
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReplaceImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingImages}
                      onClick={() => multiFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-full bg-[#8C1D5E] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#5A0D3F] transition-colors disabled:opacity-60"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{uploadingImages ? 'Uploading...' : 'Upload Product Photos'}</span>
                    </button>
                  </div>
                </div>

                {/* Optional External Image URL */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Or paste hosted https:// image URL..."
                    className="flex-1 min-w-[220px] rounded-full border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2 text-xs focus:border-[#5A0D3F] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddExternalImageUrl}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#5A0D3F] px-4 py-2 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    <span>Add URL</span>
                  </button>
                </div>

                {form.images.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => multiFileInputRef.current?.click()}
                    className="w-full rounded-2xl border-2 border-dashed border-[#DFC9D4] bg-[#FDFBF9] py-10 px-4 text-center hover:border-[#5A0D3F] transition-colors"
                  >
                    <ImagePlus className="mx-auto h-8 w-8 text-[#8C1D5E]" />
                    <p className="mt-2 text-sm font-semibold text-[#5A0D3F]">
                      Click to upload product photos from phone or computer
                    </p>
                    <p className="mt-1 text-xs text-[#7A5B6B]">
                      Supports JPG, PNG, WebP · Select multiple files at once
                    </p>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {form.images.map((img) => (
                      <div
                        key={img.id}
                        className={`rounded-2xl border p-2 bg-[#FDFBF9] flex flex-col gap-2 ${
                          img.isPrimary ? 'border-[#5A0D3F] ring-2 ring-[#5A0D3F]/20' : 'border-[#EFE3E9]'
                        }`}
                      >
                        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-white">
                          <ResolvedImage
                            image={img}
                            alt={img.alt || form.name || 'Uploaded preview'}
                            className="h-full w-full object-cover object-top"
                          />
                          {img.isPrimary && (
                            <span className="absolute top-2 left-2 rounded-full bg-[#5A0D3F] px-2 py-0.5 text-[10px] font-semibold text-white">
                              Primary
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1">
                          {!img.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(img.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#F8EEF2] px-2 py-1 text-[11px] font-semibold text-[#5A0D3F] hover:bg-[#5A0D3F] hover:text-white"
                            >
                              <Star className="h-3 w-3" />
                              <span>Set Primary</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setReplacingImageId(img.id);
                              replaceFileInputRef.current?.click();
                            }}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#E5D3DC] bg-white px-2 py-1 text-[11px] font-medium text-[#4E2A3E] hover:border-[#5A0D3F]"
                            title="Replace image"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img.id)}
                            aria-label="Remove uploaded image"
                            className="inline-flex items-center justify-center rounded-lg border border-[#E5D3DC] bg-white px-2 py-1 text-[11px] text-[#A81D63] hover:bg-[#FDF0F3]"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EFE3E9]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full border border-[#D4B4C4] px-6 py-2.5 text-xs font-semibold text-[#5A0D3F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="rounded-full bg-[#5A0D3F] px-7 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554] disabled:opacity-60"
                >
                  {savingProduct
                    ? 'Saving to Cloud...'
                    : form.id
                    ? 'Save Product Updates'
                    : 'Save & Publish to Storefront'}
                </button>
              </div>
            </form>
          )}

          {/* Inventory Filter & List */}
          <div className="mt-8 rounded-3xl bg-white p-5 sm:p-7 border border-[#EFE3E9]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F4EAEF]">
              <h2 className="font-serif text-xl font-semibold text-[#5A0D3F]">
                Catalog Inventory ({filteredProducts.length})
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Filter inventory by name..."
                  aria-label="Filter inventory"
                  className="rounded-full border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2 text-xs focus:border-[#5A0D3F] focus:outline-none"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as CategorySlug | 'all')}
                  aria-label="Filter inventory by category"
                  className="rounded-full border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2 text-xs font-medium focus:border-[#5A0D3F] focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 divide-y divide-[#F4EAEF]">
              {filteredProducts.map((product) => {
                const primary = getPrimaryImage(product);
                const isDeleting = confirmDeleteId === product.id;

                return (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F8F3EF] border border-[#EFE3E9]">
                        <ResolvedImage
                          image={primary}
                          alt={product.name}
                          className="h-full w-full object-cover object-top"
                        />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onNavigate({ view: 'product', productId: product.id })}
                          className="text-left font-semibold text-sm text-[#2A1121] hover:text-[#5A0D3F] truncate block"
                        >
                          {product.name}
                        </button>
                        <p className="text-xs text-[#7A5B6B]">
                          {getCategoryLabel(product.category)} · {product.images.length}{' '}
                          {product.images.length === 1 ? 'photo' : 'photos'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs tabular-nums">
                          <span className="font-bold text-[#5A0D3F]">
                            {formatINR(product.sellingPrice)}
                          </span>
                          <span className="text-[#8E6F80] line-through">
                            {formatINR(product.originalPrice)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStatusToggle(product)}
                            className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                              product.status === 'active'
                                ? 'bg-[#EEF7F1] text-[#21593A]'
                                : product.status === 'out_of_stock'
                                ? 'bg-[#FDF4E6] text-[#8C5B12]'
                                : 'bg-[#F3ECEF] text-[#6F4359]'
                            }`}
                            title="Click to cycle status"
                          >
                            {product.status === 'active'
                              ? 'Active'
                              : product.status === 'out_of_stock'
                              ? 'Out of Stock'
                              : 'Draft'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => openEditProductForm(product)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#D4B4C4] bg-white px-4 py-1.5 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit / Photos</span>
                      </button>

                      {isDeleting ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(product)}
                            className="rounded-full bg-[#A81D63] px-3.5 py-1.5 text-xs font-semibold text-white"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-full border border-[#D4B4C4] px-3 py-1.5 text-xs font-medium text-[#5A0D3F]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(product.id)}
                          aria-label={`Delete ${product.name}`}
                          className="inline-flex items-center gap-1 rounded-full border border-[#E5D3DC] bg-white px-3.5 py-1.5 text-xs font-medium text-[#A81D63] hover:bg-[#FDF0F3]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Customer Orders Management Tab */
        <div className="mt-8 rounded-3xl bg-white p-5 sm:p-7 border border-[#EFE3E9]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F4EAEF]">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#5A0D3F]">
                Customer Orders ({filteredOrders.length})
              </h2>
              <p className="text-xs text-[#7A5B6B]">
                Live orders placed via Guest Checkout and Signed-In Customers.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setOrderFilterStatus('all')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  orderFilterStatus === 'all'
                    ? 'bg-[#5A0D3F] text-white'
                    : 'border border-[#E5D3DC] text-[#4E2A3E] hover:border-[#5A0D3F]'
                }`}
              >
                All ({orders.length})
              </button>
              {ALL_ORDER_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderFilterStatus(st)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    orderFilterStatus === st
                      ? 'bg-[#5A0D3F] text-white'
                      : 'border border-[#E5D3DC] text-[#4E2A3E] hover:border-[#5A0D3F]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-8 w-8 text-[#C59B48]" />
              <p className="mt-3 font-serif text-xl font-semibold text-[#5A0D3F]">
                No orders in this status
              </p>
              <p className="mt-1 text-xs text-[#7A5B6B]">
                New customer orders placed from Checkout will appear here live.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-[#F4EAEF]">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const items = orderItemsMap[order.id];
                const waDigits = order.phone.replace(/\D/g, '');
                const waTarget = waDigits.length === 10 ? `91${waDigits}` : waDigits;

                return (
                  <div key={order.id} className="py-5 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#5A0D3F]">
                            {order.orderCode}
                          </span>
                          <span
                            className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${
                              ORDER_STATUS_BADGES[order.status]
                            }`}
                          >
                            {ORDER_STATUS_LABELS[order.status]}
                          </span>
                          <span className="rounded-full bg-[#F8EEF2] px-2.5 py-0.5 text-[10px] font-semibold text-[#5A0D3F]">
                            {order.isGuest ? 'Guest Checkout' : 'Signed-In Customer'}
                          </span>
                          <span className="rounded-full border border-[#E5D3DC] px-2.5 py-0.5 text-[10px] font-semibold text-[#4E2A3E]">
                            {order.paymentMethod === 'upi_manual' ? 'UPI / WhatsApp' : 'COD'}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-[#2A1121]">
                          {order.customerName} ·{' '}
                          <a
                            href={`tel:${order.phone}`}
                            className="inline-flex items-center gap-1 text-[#5A0D3F] hover:underline tabular-nums"
                          >
                            <Phone className="h-3 w-3" />
                            {order.phone}
                          </a>
                          {order.customerEmail && (
                            <span className="ml-2 text-xs font-normal text-[#7A5B6B]">
                              ({order.customerEmail})
                            </span>
                          )}
                        </p>

                        <p className="text-xs text-[#4E2A3E]">
                          {order.address}, {order.city} – {order.pincode}
                        </p>

                        {order.notes && (
                          <p className="text-xs italic text-[#7A5B6B]">Note: “{order.notes}”</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base font-bold text-[#5A0D3F] tabular-nums mr-1">
                          {formatINR(order.grandTotal)}
                        </span>

                        <select
                          aria-label={`Order status for ${order.orderCode}`}
                          disabled={updatingOrderId === order.id}
                          value={order.status}
                          onChange={(e) =>
                            handleOrderStatusChange(order, e.target.value as OrderStatus)
                          }
                          className="rounded-full border border-[#D4B4C4] bg-[#FDFBF9] px-3.5 py-1.5 text-xs font-semibold text-[#5A0D3F] focus:border-[#5A0D3F] focus:outline-none"
                        >
                          {ALL_ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {ORDER_STATUS_LABELS[st]}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleToggleOrderItems(order.id)}
                          className="rounded-full border border-[#D4B4C4] px-3.5 py-1.5 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
                        >
                          {isExpanded ? 'Hide Items' : `Items (${order.itemCount})`}
                        </button>

                        <a
                          href={`https://wa.me/${waTarget}?text=${encodeURIComponent(
                            `Hello ${order.customerName}, regarding your STARLITES CLOTHING order ${order.orderCode} (${ORDER_STATUS_LABELS[order.status]}): `
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-[#21593A] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#19452D]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="rounded-2xl bg-[#FDFBF9] border border-[#EFE3E9] p-4 space-y-2">
                        {items ? (
                          items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-xs py-1 border-b last:border-b-0 border-[#F4EAEF]"
                            >
                              <span className="text-[#2A1121]">
                                <strong>{item.productName}</strong> · Size {item.size} ·{' '}
                                {item.colorName} × {item.quantity}
                              </span>
                              <span className="font-semibold text-[#5A0D3F] tabular-nums">
                                {formatINR(item.lineTotal)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#7A5B6B]">Loading order items...</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
