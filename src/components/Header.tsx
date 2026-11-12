import React, { useState } from 'react';
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { CATEGORIES } from '../services/catalogLogic';
import type { AppRoute, CategorySlug } from '../types/store';
import { StarlitesLogo } from './StarlitesLogo';

interface HeaderProps {
  currentRoute: AppRoute;
  searchQuery: string;
  wishlistCount: number;
  cartCount: number;
  onNavigate: (route: AppRoute) => void;
  onSearchSubmit: (query: string) => void;
  onOpenWishlist: () => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  searchQuery,
  wishlistCount,
  cartCount,
  onNavigate,
  onSearchSubmit,
  onOpenWishlist,
  onOpenCart,
  onOpenAccount,
}) => {
  const [inputQuery, setInputQuery] = useState(searchQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(inputQuery.trim());
    setMobileMenuOpen(false);
  };

  const handleCategoryClick = (slug: CategorySlug) => {
    onNavigate({ view: 'shop', category: slug });
    setMobileMenuOpen(false);
  };

  const isHomeActive = currentRoute.view === 'home';
  const activeCategory =
    currentRoute.view === 'shop' ? currentRoute.category : undefined;

  return (
    <>
      {/* Announcement Bar (scrolls naturally so sticky header stays compact on mobile) */}
      <div className="bg-[#5A0D3F] text-white text-[11px] sm:text-xs py-2 px-4 text-center">
        <div className="mx-auto max-w-[1360px] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-medium tracking-wide">
          <span>New Arrivals Are Here</span>
          <span aria-hidden="true" className="text-[#C59B48]">|</span>
          <span>Flat 10% Off on Your First Order</span>
          <span aria-hidden="true" className="text-[#C59B48] hidden sm:inline">|</span>
          <span className="hidden sm:inline">Free Shipping on Orders Above ₹999</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#EFE3E9]">
        {/* Main Brand, Search & Actions Row */}
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-[70px] items-center justify-between gap-3 sm:gap-6">
          {/* Mobile Menu Trigger + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5A0D3F] hover:bg-[#F8EEF2] transition-colors focus-visible:outline-2 focus-visible:outline-[#5A0D3F]"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate({ view: 'home' });
                setMobileMenuOpen(false);
              }}
              className="text-left focus-visible:outline-2 focus-visible:outline-[#5A0D3F] rounded-lg py-1"
              aria-label="STARLITES CLOTHING Home"
            >
              <StarlitesLogo variant="light" compact />
            </button>
          </div>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSubmit}
            className="hidden md:flex flex-1 max-w-md mx-4"
            role="search"
          >
            <div className="relative flex w-full items-center">
              <label htmlFor="header-search" className="sr-only">
                Search products
              </label>
              <input
                id="header-search"
                type="search"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Search tops, nightwear, co-ord sets..."
                className="w-full rounded-full border border-[#E5D3DC] bg-[#FDFBF9] py-2.5 pl-5 pr-12 text-sm text-[#2A1121] placeholder:text-[#8E6F80] focus:border-[#5A0D3F] focus:bg-white focus:outline-none transition-colors"
              />
              <button
                type="submit"
                aria-label="Search products"
                className="absolute right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#5A0D3F] hover:bg-[#F8EEF2] transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Right Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenAccount}
              aria-label="Customer account demo"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#3D162D] hover:bg-[#F8EEF2] transition-colors focus-visible:outline-2 focus-visible:outline-[#5A0D3F]"
            >
              <User className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onOpenWishlist}
              aria-label={`Open wishlist (${wishlistCount} items)`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#3D162D] hover:bg-[#F8EEF2] transition-colors focus-visible:outline-2 focus-visible:outline-[#5A0D3F]"
            >
              <Heart className="h-5 w-5" />
              <span
                data-testid="wishlist-count"
                className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#5A0D3F] px-1 text-[10px] font-semibold text-white tabular-nums"
              >
                {wishlistCount}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Open shopping bag (${cartCount} items)`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#3D162D] hover:bg-[#F8EEF2] transition-colors focus-visible:outline-2 focus-visible:outline-[#5A0D3F]"
            >
              <ShoppingBag className="h-5 w-5" />
              <span
                data-testid="cart-count"
                className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#5A0D3F] px-1 text-[10px] font-semibold text-white tabular-nums"
              >
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Row */}
        <form onSubmit={handleSubmit} className="pb-2.5 md:hidden" role="search">
          <div className="relative flex w-full items-center">
            <label htmlFor="mobile-search" className="sr-only">
              Search products
            </label>
            <input
              id="mobile-search"
              type="search"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Search tops, sets, nightwear, maxi dresses..."
              className="w-full rounded-full border border-[#E5D3DC] bg-[#FDFBF9] py-1.5 pl-4 pr-11 text-sm text-[#2A1121] placeholder:text-[#8E6F80] focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="absolute right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#5A0D3F]"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Desktop Category Navigation Row */}
        <nav
          aria-label="Main Categories"
          className="hidden lg:flex items-center justify-center gap-6 border-t border-[#F4EAEF] py-2.5 overflow-x-auto no-scrollbar"
        >
          <button
            type="button"
            onClick={() => onNavigate({ view: 'home' })}
            className={`whitespace-nowrap shrink-0 pb-0.5 text-[13px] font-medium transition-colors border-b-2 ${
              isHomeActive
                ? 'border-[#5A0D3F] text-[#5A0D3F] font-semibold'
                : 'border-transparent text-[#4A263A] hover:text-[#5A0D3F]'
            }`}
          >
            Home
          </button>

          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => handleCategoryClick(cat.slug)}
                className={`whitespace-nowrap shrink-0 pb-0.5 text-[13px] font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-[#5A0D3F] text-[#5A0D3F] font-semibold'
                    : 'border-transparent text-[#4A263A] hover:text-[#5A0D3F]'
                }`}
              >
                {cat.shortName}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onNavigate({ view: 'shop', category: 'all' })}
            className={`whitespace-nowrap shrink-0 pb-0.5 text-[13px] font-medium transition-colors border-b-2 ${
              currentRoute.view === 'shop' && activeCategory === 'all' && !currentRoute.collection
                ? 'border-[#5A0D3F] text-[#5A0D3F] font-semibold'
                : 'border-transparent text-[#4A263A] hover:text-[#5A0D3F]'
            }`}
          >
            All Styles
          </button>
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#2A1121]/45 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            aria-label="Mobile Navigation"
            className="relative z-10 flex w-[82%] max-w-sm flex-col bg-[#FDFBF9] h-full shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#EFE3E9] px-5 py-4 bg-white">
              <StarlitesLogo variant="light" compact />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5A0D3F] hover:bg-[#F8EEF2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col p-4 gap-1">
              <button
                type="button"
                onClick={() => {
                  onNavigate({ view: 'home' });
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                  isHomeActive ? 'bg-[#F8EEF2] text-[#5A0D3F]' : 'text-[#2A1121] hover:bg-[#F8EEF2]/60'
                }`}
              >
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate({ view: 'shop', category: 'all' });
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-[#2A1121] hover:bg-[#F8EEF2]/60"
              >
                <span>Shop All Collections</span>
              </button>

              <div className="mt-3 mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#8C1D5E]">
                Categories
              </div>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm ${
                    activeCategory === cat.slug
                      ? 'bg-[#F8EEF2] font-semibold text-[#5A0D3F]'
                      : 'text-[#3D162D] hover:bg-[#F8EEF2]/60'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}

              <div className="mt-4 pt-4 border-t border-[#EFE3E9] flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate({ view: 'info', page: 'story' });
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-xl px-4 py-2.5 text-left text-sm text-[#3D162D] hover:bg-[#F8EEF2]/60"
                >
                  Our Story
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate({ view: 'info', page: 'size-guide' });
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-xl px-4 py-2.5 text-left text-sm text-[#3D162D] hover:bg-[#F8EEF2]/60"
                >
                  Size Guide
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate({ view: 'info', page: 'contact' });
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-xl px-4 py-2.5 text-left text-sm text-[#3D162D] hover:bg-[#F8EEF2]/60"
                >
                  Contact Us · 8807732182
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
    </>
  );
};
