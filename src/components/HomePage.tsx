import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Instagram,
  Mail,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { CATEGORIES } from '../services/catalogLogic';
import type { AppRoute, Product, ProductSize } from '../types/store';
import { ProductCard } from './ProductCard';
import { ResolvedImage } from './ResolvedImage';
import { StarlitesLogo } from './StarlitesLogo';

interface HomePageProps {
  products: Product[];
  wishlistIds: string[];
  onNavigate: (route: AppRoute) => void;
  onToggleWishlist: (productId: string) => void;
  onAddToBag: (params: {
    productId: string;
    size: ProductSize;
    colorName: string;
    colorHex: string;
  }) => void;
}

const HERO_SLIDES = [
  {
    kicker: 'FASHION FOR EVERY VERSION OF YOU',
    headline: 'Find Your Everyday Shine',
    subcopy:
      'Comfortable. Stylish. Versatile. Breathable cottons and signature silhouettes crafted for Indian women.',
    ctaLabel: 'Shop the Collection',
    assetKey: 'hero_starlites_editorial',
    targetRoute: { view: 'shop', category: 'all' } as AppRoute,
  },
  {
    kicker: 'TOGETHER WE SHINE',
    headline: 'Effortless Matching Sets',
    subcopy:
      'Co-ordinated two-piece & three-piece sets tailored for busy mornings, workdays, and warm celebrations.',
    ctaLabel: 'Explore Co-ord Sets',
    assetKey: 'cat_two_piece_sets',
    targetRoute: { view: 'shop', category: 'two-piece-sets' } as AppRoute,
  },
  {
    kicker: 'SOFTNESS THAT STAYS',
    headline: 'Restful Nights, Graceful Days',
    subcopy:
      'Explore pure-cotton nightwear, botanical pajamas, and thoughtfully pleated maternity dresses.',
    ctaLabel: 'Shop Nightwear',
    assetKey: 'cat_nightwear_nighties',
    targetRoute: { view: 'shop', category: 'nightwear-nighties' } as AppRoute,
  },
];

const SAMPLE_TESTIMONIALS = [
  {
    id: 't1',
    name: 'Meenakshi Sundaram',
    location: 'Chennai, Tamil Nadu',
    category: 'Three-Piece Sets',
    quote:
      'The cotton quality on the Ivory 3-Piece Kurta Set feels light even in humid weather, and the stitching finish is genuinely boutique grade.',
  },
  {
    id: 't2',
    name: 'Priyadharshini R.',
    location: 'Tiruchirappalli, Tamil Nadu',
    category: 'Maternity Wear',
    quote:
      'The pleated maternity dress has such thoughtful nursing access and plenty of room without looking bulky. Truly comfortable all day.',
  },
  {
    id: 't3',
    name: 'Ananya Krishnan',
    location: 'Coimbatore, Tamil Nadu',
    category: 'Nightwear & Pajamas',
    quote:
      'Ordered the Mauve Botanical Pajama Set and a cotton nightie—both stayed soft after multiple washes with zero colour bleeding.',
  },
];

const INSTAGRAM_TILES = [
  { key: 'promo_folded_sets', label: 'Cotton Co-ord Sets', category: 'two-piece-sets' as const },
  { key: 'cat_tops_14plus', label: 'Everyday Floral Tops', category: 'tops-14-plus' as const },
  { key: 'cat_pajamas', label: 'Botanical Pajamas', category: 'pajamas' as const },
  { key: 'prod_plum_threepiece', label: 'Festive Three-Piece Sets', category: 'three-piece-sets' as const },
  { key: 'cat_maternity_wear', label: 'Maternity Comfort', category: 'maternity-wear' as const },
  { key: 'cat_maxi_dresses', label: 'Tiered Maxi Dresses', category: 'maxi-dresses' as const },
];

export const HomePage: React.FC<HomePageProps> = ({
  products,
  wishlistIds,
  onNavigate,
  onToggleWishlist,
  onAddToBag,
}) => {
  const [heroIdx, setHeroIdx] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'error' | 'subscribed'>('idle');

  const activeProducts = products.filter((p) => p.status !== 'draft');
  const newArrivals = activeProducts.filter((p) => p.isNewArrival).slice(0, 5);
  const newArrivalIds = new Set(newArrivals.map((p) => p.id));
  const bestSellersPool = activeProducts.filter((p) => p.isBestSeller);
  const bestSellers = [
    ...bestSellersPool.filter((p) => !newArrivalIds.has(p.id)),
    ...bestSellersPool.filter((p) => newArrivalIds.has(p.id)),
  ].slice(0, 5);

  const slide = HERO_SLIDES[heroIdx] ?? HERO_SLIDES[0];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setNewsletterStatus('error');
      return;
    }
    setNewsletterStatus('subscribed');
    setNewsletterEmail('');
  };

  return (
    <div className="w-full">
      {/* 1. Editorial Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#FDFBF9] via-[#FBF1F5] to-[#F3DDE6]">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]">
            {/* Left Copy */}
            <div className="lg:col-span-6 flex flex-col justify-center py-10 sm:py-14 lg:py-16 pr-0 lg:pr-8 z-10">
              <p className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-[#8C1D5E]">
                {slide.kicker}
              </p>
              <h1 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-[54px] font-semibold leading-[1.08] text-[#5A0D3F] text-balance">
                {slide.headline}
              </h1>
              <p className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-[#4E2A3E]">
                {slide.subcopy}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate(slide.targetRoute)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#5A0D3F] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(90,13,63,0.22)] hover:bg-[#7A1554] transition-colors whitespace-nowrap"
                >
                  <span>{slide.ctaLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'shop', category: 'all', collection: 'new' })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D4B4C4] bg-white/80 px-5 py-3.5 text-sm font-semibold text-[#5A0D3F] hover:bg-white transition-colors whitespace-nowrap"
                >
                  <span>New Arrivals</span>
                </button>
              </div>
            </div>

            {/* Right Model Showcase */}
            <div className="lg:col-span-6 relative min-h-[280px] sm:min-h-[360px] lg:min-h-full overflow-hidden rounded-t-3xl lg:rounded-none">
              <ResolvedImage
                assetKey={slide.assetKey}
                alt={slide.headline}
                loading="eager"
                className="h-full w-full object-cover object-top lg:object-center"
              />
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#FBF1F5] to-transparent hidden lg:block"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#F3DDE6] to-transparent hidden lg:block"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Subtle Hero Carousel Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 backdrop-blur-xs shadow-xs">
          <button
            type="button"
            onClick={() => setHeroIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            aria-label="Previous featured banner"
            className="p-0.5 text-[#5A0D3F] hover:text-[#8C1D5E]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={s.headline}
              type="button"
              onClick={() => setHeroIdx(idx)}
              aria-label={`Show banner ${idx + 1}: ${s.headline}`}
              className={`h-2 rounded-full transition-all ${
                idx === heroIdx ? 'w-6 bg-[#5A0D3F]' : 'w-2 bg-[#CFB0C0]'
              }`}
            />
          ))}
          <button
            type="button"
            onClick={() => setHeroIdx((prev) => (prev + 1) % HERO_SLIDES.length)}
            aria-label="Next featured banner"
            className="p-0.5 text-[#5A0D3F] hover:text-[#8C1D5E]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* 2. Shop by Category */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8">
          <span className="h-[1px] flex-1 max-w-[180px] bg-gradient-to-r from-transparent to-[#C59B48]" />
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#5A0D3F] text-center">
            Shop by Category
          </h2>
          <span className="h-[1px] flex-1 max-w-[180px] bg-gradient-to-l from-transparent to-[#C59B48]" />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onNavigate({ view: 'shop', category: cat.slug })}
              className="group flex flex-col items-center rounded-2xl bg-white p-2 border border-[#EFE3E9] shadow-[0_2px_10px_rgba(90,13,63,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C59B48] hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#5A0D3F]"
            >
              <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#F8F3EF]">
                <ResolvedImage
                  assetKey={cat.assetKey}
                  alt={cat.name}
                  className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span className="mt-2.5 text-center text-xs font-semibold leading-tight text-[#3D162D] group-hover:text-[#5A0D3F]">
                {cat.shortName}
              </span>
              {cat.subtitle && (
                <span className="mt-0.5 text-[10px] text-[#8E6F80]">{cat.subtitle}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* 3. New Arrivals */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 pb-12 sm:pb-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#5A0D3F]">
              New Arrivals
            </h2>
            <p className="mt-1 text-sm text-[#7A5B6B]">
              Fresh styles just in for everyday shine
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'shop', category: 'all', collection: 'new' })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5A0D3F] hover:text-[#8C1D5E] transition-colors whitespace-nowrap"
          >
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {newArrivals.map((product) => (
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
      </section>

      {/* 4. Matching Sets Promotional Banner + Dual Banners */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 pb-12 sm:pb-14 space-y-5">
        {/* Full-width Matching Sets Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#F9ECEF] via-[#FBF5F7] to-[#F3DCE5] border border-[#EFE3E9]">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center">
            <div className="md:col-span-4 h-44 md:h-52 overflow-hidden">
              <ResolvedImage
                assetKey="promo_folded_sets"
                alt="Matching cotton co-ord sets"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="md:col-span-5 px-6 py-7 text-center">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#8C1D5E]">
                Curated Ensembles
              </p>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#5A0D3F]">
                Matching Sets Collection
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#5B364B]">
                Co-ord sets, 2-piece &amp; 3-piece ensembles tailored for every occasion.
              </p>
              <button
                type="button"
                onClick={() => onNavigate({ view: 'shop', category: 'two-piece-sets' })}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#5A0D3F] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554] transition-colors"
              >
                <span>Explore Matching Sets</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="md:col-span-3 hidden md:block h-52 overflow-hidden">
              <ResolvedImage
                assetKey="cat_three_piece_sets"
                alt="Three piece kurta set"
                className="h-full w-full object-cover object-top"
              />
            </div>
          </div>
        </div>

        {/* Dual Promotional Banners: Nightwear & Maternity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-r from-[#FAF2F5] to-[#F4E1EA] border border-[#EFE3E9]">
            <div className="p-6 sm:p-8 flex-1">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[#8C1D5E]">
                Soft · Comfy · Relaxed
              </p>
              <h3 className="mt-1 font-serif text-2xl font-semibold text-[#5A0D3F]">
                Nightwear Collection
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-[#5B364B]">
                Sleep in pure cotton comfort, wake in effortless style.
              </p>
              <button
                type="button"
                onClick={() => onNavigate({ view: 'shop', category: 'nightwear-nighties' })}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#5A0D3F] px-5 py-2 text-xs font-semibold text-white hover:bg-[#7A1554] transition-colors"
              >
                <span>Shop Nightwear</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="w-36 sm:w-44 h-48 sm:h-52 shrink-0 overflow-hidden">
              <ResolvedImage
                assetKey="cat_nightwear_nighties"
                alt="STARLITES Nightwear Collection"
                className="h-full w-full object-cover object-top"
              />
            </div>
          </div>

          <div className="flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-r from-[#F9F0F4] to-[#F1DCE7] border border-[#EFE3E9]">
            <div className="p-6 sm:p-8 flex-1">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[#8C1D5E]">
                Gentle Support
              </p>
              <h3 className="mt-1 font-serif text-2xl font-semibold text-[#5A0D3F]">
                Maternity Wear
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-[#5B364B]">
                Thoughtful comfort for every milestone of motherhood.
              </p>
              <button
                type="button"
                onClick={() => onNavigate({ view: 'shop', category: 'maternity-wear' })}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#5A0D3F] px-5 py-2 text-xs font-semibold text-white hover:bg-[#7A1554] transition-colors"
              >
                <span>Shop Maternity</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="w-36 sm:w-44 h-48 sm:h-52 shrink-0 overflow-hidden">
              <ResolvedImage
                assetKey="cat_maternity_wear"
                alt="STARLITES Maternity Wear"
                className="h-full w-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Best Sellers */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 pb-12 sm:pb-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#5A0D3F]">
              Best Sellers
            </h2>
            <p className="mt-1 text-sm text-[#7A5B6B]">
              Most-loved silhouettes across Tiruchirappalli and beyond
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'shop', category: 'all', collection: 'best' })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5A0D3F] hover:text-[#8C1D5E] transition-colors whitespace-nowrap"
          >
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {bestSellers.map((product) => (
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
      </section>

      {/* 6. Why Shop With Us */}
      <section className="border-y border-[#EFE3E9] bg-[#FBF6F8]">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-9">
          <h2 className="sr-only">Why Shop With Us</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#5A0D3F] border border-[#EAD7E1]">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2A1121]">Free Shipping</p>
                <p className="text-xs text-[#7A5B6B]">On all orders above ₹999</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#5A0D3F] border border-[#EAD7E1]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2A1121]">Quality Assured</p>
                <p className="text-xs text-[#7A5B6B]">Breathable cottons &amp; neat finish</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#5A0D3F] border border-[#EAD7E1]">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2A1121]">Easy Returns</p>
                <p className="text-xs text-[#7A5B6B]">7-day hassle-free exchange</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#5A0D3F] border border-[#EAD7E1]">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2A1121]">Customer Support</p>
                <p className="text-xs text-[#7A5B6B] tabular-nums">Call or WhatsApp: 8807732182</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. About STARLITES ("Our Story") */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="overflow-hidden rounded-3xl bg-white border border-[#EFE3E9] shadow-[0_4px_20px_rgba(90,13,63,0.04)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-5 min-h-[260px] overflow-hidden">
              <ResolvedImage
                assetKey="prod_story_rack"
                alt="STARLITES CLOTHING curated garment rack"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="lg:col-span-7 flex flex-col justify-center p-7 sm:p-10 lg:p-12 bg-gradient-to-br from-white via-[#FDFBF9] to-[#F9EEF3]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#8C1D5E]">
                    About STARLITES
                  </p>
                  <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[#5A0D3F]">
                    Our Story — Together We Shine
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#4E2A3E]">
                    Founded in E-Pudur, Tiruchirappalli by Managing Director{' '}
                    <span className="font-semibold text-[#5A0D3F]">Nandhini Devi</span>, STARLITES
                    CLOTHING believes fashion is more than what you wear—it is how effortlessly
                    confident you feel in every role you play. From breathable everyday tops and
                    innerwear to restful nightwear, maternity silhouettes, and festive three-piece
                    sets, every piece is curated for real Indian wardrobes.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate({ view: 'info', page: 'story' })}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#5A0D3F] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554] transition-colors"
                  >
                    <span>Know More</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="hidden sm:flex shrink-0 flex-col items-center rounded-2xl bg-white/90 p-5 border border-[#EFE3E9]">
                  <StarlitesLogo variant="light" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Customer Testimonials (Clearly Labelled Sample Content) */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 pb-12 sm:pb-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#5A0D3F]">
              Customer Love
            </h2>
            <p className="mt-1 text-sm text-[#7A5B6B]">
              Sample customer reviews showcasing feedback across our core collections
            </p>
          </div>
          <span className="text-xs font-medium text-[#8C1D5E]">
            Sample Customer Testimonials (Demo Content)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SAMPLE_TESTIMONIALS.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-2xl bg-white p-6 border border-[#EFE3E9]"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#8C1D5E] font-medium">
                  <span>{item.category}</span>
                  <span>Sample Review</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#3D162D]">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#F4EAEF]">
                <p className="text-sm font-semibold text-[#2A1121]">{item.name}</p>
                <p className="text-xs text-[#7A5B6B]">{item.location}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 9. Instagram-style Fashion Gallery */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 pb-12 sm:pb-14">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#5A0D3F]">
            <Instagram className="h-4 w-4 text-[#8C1D5E]" />
            <span>Follow Us on Instagram @Starlites_offical</span>
          </div>
          <p className="mt-1 text-xs text-[#7A5B6B]">
            Tap any look to explore the matching collection
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {INSTAGRAM_TILES.map((tile) => (
            <button
              key={tile.key}
              type="button"
              onClick={() => onNavigate({ view: 'shop', category: tile.category })}
              aria-label={`Shop ${tile.label} from Instagram gallery`}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-[#EFE3E9] bg-[#F8F3EF] focus-visible:outline-2 focus-visible:outline-[#5A0D3F]"
            >
              <ResolvedImage
                assetKey={tile.key}
                alt={tile.label}
                className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#34082C]/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <span className="text-xs font-medium text-white text-left">{tile.label}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 10. Newsletter Subscription (Demo Only) */}
      <section className="bg-[#5A0D3F] text-white">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-9">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 text-center lg:text-left">
              <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#E8C97E]">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white">
                  Stay in the Loop
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#EAD6E2]">
                  Get updates on new arrivals, seasonal offers, and exclusive collections (Demo preview).
                </p>
              </div>
            </div>

            <form
              onSubmit={handleNewsletterSubmit}
              className="w-full max-w-md flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              noValidate
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value);
                  if (newsletterStatus !== 'idle') setNewsletterStatus('idle');
                }}
                placeholder="Enter your email address"
                className="flex-1 rounded-full bg-white px-5 py-3 text-sm text-[#2A1121] placeholder:text-[#8E6F80] focus:outline-2 focus:outline-[#C59B48]"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#B11B6D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#99155C] transition-colors whitespace-nowrap"
              >
                <span>Subscribe</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {newsletterStatus === 'error' && (
            <p className="mt-3 text-center lg:text-right text-xs text-[#FCD2DF]" role="alert">
              Please enter a valid email address to preview newsletter sign-up.
            </p>
          )}
          {newsletterStatus === 'subscribed' && (
            <p className="mt-3 text-center lg:text-right text-xs text-[#F5DF9F]" role="status">
              Thank you! Your email has been recorded in this demo preview. Together We Shine.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
