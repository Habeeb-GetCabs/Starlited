import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Edit3,
  ImagePlus,
  Plus,
  RefreshCw,
  RotateCcw,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { CATEGORIES, getCategoryLabel, getPrimaryImage } from '../services/catalogLogic';
import { deleteImageFile, saveImageFile } from '../services/imageStorageService';
import { calculateDiscountPercent, formatINR } from '../services/pricingLogic';
import type {
  AppRoute,
  CategorySlug,
  Product,
  ProductColor,
  ProductImageRef,
  ProductSize,
  ProductStatus,
} from '../types/store';
import { ResolvedImage } from './ResolvedImage';

interface AdminPageProps {
  products: Product[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onResetCatalog: () => void;
  onNavigate: (route: AppRoute) => void;
}

const ALL_SIZES: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

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
  onSaveProduct,
  onDeleteProduct,
  onResetCatalog,
  onNavigate,
}) => {
  const [form, setForm] = useState<FormState>(createEmptyForm);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<CategorySlug | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#8C1D5E');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null);

  const multiFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return products.filter((p) => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (q && !p.name.toLowerCase().includes(q) && !getCategoryLabel(p.category).toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [products, filterCategory, searchText]);

  const sellingNum = Number(form.sellingPrice) || 0;
  const originalNum = Number(form.originalPrice) || 0;
  const discountPreview = calculateDiscountPercent(sellingNum, originalNum);

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
        const id = await saveImageFile(file);
        uploadedRefs.push({
          id,
          source: 'indexeddb',
          isPrimary: false,
          alt: form.name.trim() || file.name,
        });
      }

      setForm((prev) => {
        const combined = [...prev.images, ...uploadedRefs];
        if (!combined.some((img) => img.isPrimary) && combined.length > 0) {
          combined[0] = { ...combined[0], isPrimary: true };
        }
        return { ...prev, images: combined };
      });
    } catch {
      setFormError('Could not save one or more uploaded images to IndexedDB.');
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
      const newId = await saveImageFile(file);
      const oldImg = form.images.find((img) => img.id === targetId);
      if (oldImg?.source === 'indexeddb') {
        await deleteImageFile(oldImg.id);
      }
      setForm((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === targetId
            ? {
                id: newId,
                source: 'indexeddb',
                isPrimary: img.isPrimary,
                alt: form.name.trim() || file.name,
              }
            : img
        ),
      }));
    } catch {
      setFormError('Failed to replace image in IndexedDB.');
    } finally {
      setUploadingImages(false);
      setReplacingImageId(null);
      e.target.value = '';
    }
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
    if (target?.source === 'indexeddb') {
      await deleteImageFile(target.id);
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

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Please enter a product name.');
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
      images: form.images,
    };

    onSaveProduct(saved);
    setShowForm(false);
    setForm(createEmptyForm());
    setStatusMessage(`Saved "${saved.name}" — it is now live in the storefront.`);
  };

  const handleQuickStatusToggle = (product: Product) => {
    const nextStatus: ProductStatus =
      product.status === 'active'
        ? 'out_of_stock'
        : product.status === 'out_of_stock'
        ? 'draft'
        : 'active';
    onSaveProduct({ ...product, status: nextStatus });
    setStatusMessage(`Updated status of "${product.name}" to ${nextStatus.replace('_', ' ')}.`);
  };

  const handleConfirmDelete = async (product: Product) => {
    for (const img of product.images) {
      if (img.source === 'indexeddb') {
        await deleteImageFile(img.id);
      }
    }
    onDeleteProduct(product.id);
    setConfirmDeleteId(null);
    setStatusMessage(`Deleted "${product.name}" from the catalog.`);
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
          <h1 className="font-serif text-3xl font-semibold text-[#5A0D3F]">
            Store Owner Demo Portal
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#7A5B6B]">
            Upload real product photographs (stored persistently in browser IndexedDB), update
            prices, and manage catalog items across all nine categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onResetCatalog}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D4B4C4] bg-white px-4 py-2.5 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Sample Data</span>
          </button>
          <button
            type="button"
            onClick={openNewProductForm}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#5A0D3F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554]"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>
        </div>
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
              placeholder="Describe the silhouette, comfort fit, and occasion..."
              className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <span className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                Calculated Discount
              </span>
              <div className="rounded-xl border border-[#EFE3E9] bg-[#FAF3F6] px-4 py-2.5 text-sm font-semibold text-[#8C1D5E] tabular-nums">
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
                <option value="active">Active (Visible in Store)</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="adm-fabric" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                Fabric &amp; Care Note
              </label>
              <input
                id="adm-fabric"
                type="text"
                value={form.fabricCare}
                onChange={(e) => setForm((f) => ({ ...f, fabricCare: e.target.value }))}
                className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-5">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#2A1121] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNewArrival}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isNewArrival: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[#5A0D3F]"
                />
                <span>Mark as New Arrival</span>
              </label>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#2A1121] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isBestSeller}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isBestSeller: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[#5A0D3F]"
                />
                <span>Mark as Best Seller</span>
              </label>
            </div>
          </div>

          {/* Sizes Selection */}
          <div>
            <span className="block text-xs font-semibold text-[#2A1121] mb-2">
              Available Sizes *
            </span>
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
                        : 'border border-[#DFC9D4] bg-white text-[#4E2A3E]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colours Selection */}
          <div>
            <span className="block text-xs font-semibold text-[#2A1121] mb-2">
              Available Colours
            </span>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((color) => {
                const active = form.colors.some((c) => c.name === color.name);
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => togglePresetColor(color)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors ${
                      active
                        ? 'border-[#5A0D3F] bg-[#F8EEF2] font-semibold text-[#5A0D3F]'
                        : 'border-[#E5D3DC] bg-white text-[#4E2A3E]'
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

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                placeholder="Custom colour name (e.g., Sage Green)"
                className="rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-3 py-1.5 text-xs focus:border-[#5A0D3F] focus:outline-none"
              />
              <input
                type="color"
                value={customColorHex}
                onChange={(e) => setCustomColorHex(e.target.value)}
                aria-label="Pick custom colour swatch"
                className="h-8 w-10 rounded cursor-pointer border border-[#DFC9D4]"
              />
              <button
                type="button"
                onClick={handleAddCustomColor}
                className="rounded-full border border-[#5A0D3F] px-3.5 py-1.5 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
              >
                Add Colour
              </button>
            </div>
          </div>

          {/* Multiple Image Upload & Management (IndexedDB) */}
          <div className="pt-4 border-t border-[#EFE3E9]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#5A0D3F]">
                  Product Photographs (IndexedDB Persistent Storage)
                </h3>
                <p className="text-xs text-[#7A5B6B]">
                  Upload multiple photos from computer or phone, preview them, pick the primary image,
                  replace, or remove photos.
                </p>
              </div>

              <input
                ref={multiFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultiImageUpload}
                className="hidden"
                id="adm-multi-image-upload"
              />
              <input
                ref={replaceFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReplaceImageUpload}
                className="hidden"
                id="adm-replace-image-upload"
              />

              <button
                type="button"
                disabled={uploadingImages}
                onClick={() => multiFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-[#8C1D5E] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#5A0D3F] transition-colors shrink-0"
              >
                <Upload className="h-4 w-4" />
                <span>{uploadingImages ? 'Saving Photos...' : 'Upload Product Photos'}</span>
              </button>
            </div>

            {form.images.length === 0 ? (
              <div
                onClick={() => multiFileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-[#D8BAC9] bg-[#FDFBF9] py-10 px-4 text-center hover:border-[#5A0D3F] transition-colors"
              >
                <ImagePlus className="mx-auto h-8 w-8 text-[#8C1D5E]" />
                <p className="mt-2 text-sm font-semibold text-[#5A0D3F]">
                  Click to upload product photos
                </p>
                <p className="mt-1 text-xs text-[#7A5B6B]">
                  Supports JPG, PNG, WebP · Stored locally in IndexedDB so images stay after refresh
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {form.images.map((img) => (
                  <div
                    key={img.id}
                    className={`rounded-2xl p-2 border bg-[#FDFBF9] flex flex-col gap-2 ${
                      img.isPrimary ? 'border-[#5A0D3F] ring-2 ring-[#5A0D3F]/20' : 'border-[#EFE3E9]'
                    }`}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white">
                      <ResolvedImage
                        image={img}
                        alt={img.alt || form.name || 'Uploaded preview'}
                        className="h-full w-full object-cover object-top"
                      />
                      {img.isPrimary && (
                        <span className="absolute top-2 left-2 rounded bg-[#5A0D3F] px-2 py-0.5 text-[10px] font-semibold text-white">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(img.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-[#F8EEF2] px-2 py-1 text-[11px] font-semibold text-[#5A0D3F] hover:bg-[#EED9E4]"
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
              className="rounded-full bg-[#5A0D3F] px-7 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554]"
            >
              {form.id ? 'Save Product Updates' : 'Save & Publish to Storefront'}
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
    </div>
  );
};
