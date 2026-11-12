import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ShieldAlert,
  Smartphone,
  Truck,
} from 'lucide-react';
import { getPrimaryImage } from '../services/catalogLogic';
import { calculateCartTotals, formatINR } from '../services/pricingLogic';
import type { AppRoute, CartItem, Product } from '../types/store';
import { ResolvedImage } from './ResolvedImage';

interface CheckoutDemoPageProps {
  items: CartItem[];
  productsById: Record<string, Product | undefined>;
  onNavigate: (route: AppRoute) => void;
}

export const CheckoutDemoPage: React.FC<CheckoutDemoPageProps> = ({
  items,
  productsById,
  onNavigate,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Tiruchirappalli');
  const [pincode, setPincode] = useState('');
  const [paymentMode, setPaymentMode] = useState<'upi' | 'card' | 'cod'>('upi');
  const [errorMsg, setErrorMsg] = useState('');
  const [demoPreviewReady, setDemoPreviewReady] = useState(false);

  const totals = calculateCartTotals(items, productsById);

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      setErrorMsg('Please fill in all delivery preview fields before generating the checkout preview.');
      return;
    }
    setErrorMsg('');
    setDemoPreviewReady(true);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h1 className="font-serif text-3xl font-semibold text-[#5A0D3F]">
          Checkout Demonstration
        </h1>
        <p className="mt-2 text-sm text-[#7A5B6B]">
          Your shopping bag is currently empty. Add items from the storefront to preview the checkout flow.
        </p>
        <button
          type="button"
          onClick={() => onNavigate({ view: 'shop', category: 'all' })}
          className="mt-6 rounded-full bg-[#5A0D3F] px-7 py-3 text-sm font-semibold text-white hover:bg-[#7A1554]"
        >
          Explore Collections
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <button
        type="button"
        onClick={() => onNavigate({ view: 'home' })}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A0D3F] hover:underline mb-5"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Storefront</span>
      </button>

      {/* Mandatory Demonstration Banner */}
      <div
        role="note"
        className="mb-8 flex items-start gap-3 rounded-2xl border border-[#DFB968] bg-[#FDF7E8] px-5 py-4 text-sm text-[#563B0A]"
      >
        <ShieldAlert className="h-5 w-5 shrink-0 text-[#B48324] mt-0.5" />
        <div>
          <p className="font-semibold">
            Checkout Demonstration Mode — No Real Order or Payment
          </p>
          <p className="mt-0.5 text-xs leading-relaxed">
            This checkout interface is a frontend visual demonstration only. No real orders are
            placed, no payment credentials are collected or transmitted, and no transaction is
            processed. Built ready for future Razorpay &amp; backend order integration.
          </p>
        </div>
      </div>

      {demoPreviewReady ? (
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-7 sm:p-9 border border-[#EFE3E9] shadow-sm">
          <div className="flex items-center gap-3 text-[#5A0D3F]">
            <CheckCircle2 className="h-7 w-7 text-[#8C1D5E]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8C1D5E]">
                Demonstration Preview Only
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2A1121]">
                Demo Checkout Summary Generated
              </h1>
            </div>
          </div>

          <p className="mt-4 rounded-xl bg-[#F8EEF2] px-4 py-3 text-xs text-[#5A0D3F]">
            Reminder: This is a frontend preview. Your shopping bag remains intact and no real
            order has been submitted or charged. To place an inquiry directly with STARLITES
            CLOTHING, please call or WhatsApp <strong>+91 8807732182</strong>.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-y border-[#EFE3E9] py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7A5B6B]">
                Delivery Preview
              </p>
              <p className="mt-1 font-semibold text-[#2A1121]">{fullName}</p>
              <p className="text-xs text-[#4E2A3E]">{address}</p>
              <p className="text-xs text-[#4E2A3E]">
                {city} – {pincode}
              </p>
              <p className="text-xs text-[#4E2A3E] tabular-nums">Phone: {phone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7A5B6B]">
                Selected Payment Option (Demo)
              </p>
              <p className="mt-1 font-semibold text-[#2A1121] uppercase">{paymentMode}</p>
              <p className="mt-2 text-xs text-[#7A5B6B]">
                Estimated Total:{' '}
                <strong className="text-[#5A0D3F] tabular-nums">
                  {formatINR(totals.grandTotal)}
                </strong>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setDemoPreviewReady(false)}
              className="rounded-full border border-[#5A0D3F] px-6 py-2.5 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
            >
              Edit Preview Details
            </button>
            <button
              type="button"
              onClick={() => onNavigate({ view: 'home' })}
              className="rounded-full bg-[#5A0D3F] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554]"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Shipping & Payment Preview Form */}
          <form
            onSubmit={handlePreviewSubmit}
            className="lg:col-span-7 rounded-3xl bg-white p-6 sm:p-8 border border-[#EFE3E9] space-y-6"
            noValidate
          >
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#5A0D3F]">
                Checkout Preview
              </h1>
              <p className="mt-1 text-xs text-[#7A5B6B]">
                Enter sample delivery details to preview the order summary layout.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-[#E7B5C6] bg-[#FDF0F3] px-4 py-3 text-xs font-medium text-[#8C1D5E]"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-name" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                  Full Name *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Kavya Natarajan"
                  className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="chk-phone" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                  Mobile Number *
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., 9876543210"
                  className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm tabular-nums focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="chk-address" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                Delivery Address *
              </label>
              <textarea
                id="chk-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Flat No., Street, Landmark"
                className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-city" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                  City &amp; State *
                </label>
                <input
                  id="chk-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="chk-pincode" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
                  Pincode *
                </label>
                <input
                  id="chk-pincode"
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g., 620012"
                  className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm tabular-nums focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Option Preview (No real payment info collected) */}
            <div className="pt-4 border-t border-[#EFE3E9]">
              <h2 className="text-sm font-semibold text-[#2A1121] mb-1">
                Payment Method Preview (Demo Only)
              </h2>
              <p className="text-xs text-[#7A5B6B] mb-3">
                Select a preferred payment option for layout preview. No card or UPI credentials are requested.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode('upi')}
                  className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left text-xs font-semibold transition-colors ${
                    paymentMode === 'upi'
                      ? 'border-[#5A0D3F] bg-[#F8EEF2] text-[#5A0D3F]'
                      : 'border-[#E5D3DC] bg-white text-[#4E2A3E]'
                  }`}
                >
                  <Smartphone className="h-4 w-4 shrink-0" />
                  <span>UPI / GPay (Demo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('card')}
                  className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left text-xs font-semibold transition-colors ${
                    paymentMode === 'card'
                      ? 'border-[#5A0D3F] bg-[#F8EEF2] text-[#5A0D3F]'
                      : 'border-[#E5D3DC] bg-white text-[#4E2A3E]'
                  }`}
                >
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span>Cards / Netbanking (Demo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('cod')}
                  className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left text-xs font-semibold transition-colors ${
                    paymentMode === 'cod'
                      ? 'border-[#5A0D3F] bg-[#F8EEF2] text-[#5A0D3F]'
                      : 'border-[#E5D3DC] bg-white text-[#4E2A3E]'
                  }`}
                >
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>Cash on Delivery (Demo)</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-[#5A0D3F] py-3.5 px-6 text-sm font-semibold text-white hover:bg-[#7A1554] transition-colors"
            >
              Preview Demo Checkout Summary (No Real Charge)
            </button>
          </form>

          {/* Right: Order Summary */}
          <aside className="lg:col-span-5 rounded-3xl bg-white p-6 sm:p-7 border border-[#EFE3E9] space-y-4">
            <h2 className="font-serif text-xl font-semibold text-[#5A0D3F]">
              Bag Summary ({totals.totalItems} {totals.totalItems === 1 ? 'item' : 'items'})
            </h2>

            <div className="divide-y divide-[#F4EAEF] max-h-80 overflow-y-auto pr-1">
              {items.map((item) => {
                const product = productsById[item.productId];
                if (!product) return null;
                return (
                  <div key={item.key} className="flex items-center gap-3 py-3">
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-[#F8F3EF]">
                      <ResolvedImage
                        image={getPrimaryImage(product)}
                        alt={product.name}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2A1121] truncate">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-[#7A5B6B]">
                        Size {item.size} · {item.colorName} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#5A0D3F] tabular-nums">
                      {formatINR(product.sellingPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#EFE3E9] space-y-2 text-sm">
              <div className="flex justify-between text-[#4E2A3E]">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium">{formatINR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#4E2A3E]">
                <span>Shipping</span>
                <span className="tabular-nums font-medium">
                  {totals.shippingFee === 0 ? 'FREE' : formatINR(totals.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#F4EAEF] text-base font-bold text-[#5A0D3F]">
                <span>Estimated Total</span>
                <span className="tabular-nums">{formatINR(totals.grandTotal)}</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
