import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  LogIn,
  MessageCircle,
  PackageCheck,
  Smartphone,
  Truck,
  UserCheck,
} from 'lucide-react';
import { signInWithGoogle, type AuthSessionState } from '../services/authService';
import { getPrimaryImage } from '../services/catalogLogic';
import { buildOrderWhatsAppUrl, validateCheckoutInput } from '../services/orderLogic';
import { placeCustomerOrder } from '../services/orderService';
import { calculateCartTotals, formatINR } from '../services/pricingLogic';
import type {
  AppRoute,
  CartItem,
  Order,
  OrderPaymentMethod,
  Product,
} from '../types/store';
import { ResolvedImage } from './ResolvedImage';

interface CheckoutPageProps {
  items: CartItem[];
  productsById: Record<string, Product | undefined>;
  authState: AuthSessionState;
  onClearCart: () => void;
  onNavigate: (route: AppRoute) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  productsById,
  authState,
  onClearCart,
  onNavigate,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Tiruchirappalli, Tamil Nadu');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>('cod');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Prefill from signed-in profile when available
  useEffect(() => {
    const profile = authState.profile;
    const user = authState.user;
    if (!user && !profile) return;

    setFullName((prev) => prev || profile?.displayName || user?.displayName || '');
    setPhone((prev) => prev || profile?.phone || '');
    setAddress((prev) => prev || profile?.defaultAddress || '');
    setCity((prev) => prev || profile?.defaultCity || 'Tiruchirappalli, Tamil Nadu');
    setPincode((prev) => prev || profile?.defaultPincode || '');
  }, [authState.profile, authState.user]);

  const totals = calculateCartTotals(items, productsById);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in.';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMsg(msg);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCheckoutInput({
      customerName: fullName,
      phone,
      address,
      city,
      pincode,
      notes,
      paymentMethod,
      itemCount: totals.totalItems,
    });

    if (!validation.valid) {
      setErrorMsg(validation.error || 'Please check your delivery details.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const order = await placeCustomerOrder({
        cartItems: items,
        productsById,
        customerName: fullName,
        phone,
        address,
        city,
        pincode,
        notes,
        paymentMethod,
      });
      setPlacedOrder(order);
      onClearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? 'Unable to submit your order right now. Please check your internet connection and try again.'
          : 'Unable to submit order.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    const whatsappHref = buildOrderWhatsAppUrl({
      orderCode: placedOrder.orderCode,
      customerName: placedOrder.customerName,
      phone: placedOrder.phone,
      address: placedOrder.address,
      city: placedOrder.city,
      pincode: placedOrder.pincode,
      paymentMethod: placedOrder.paymentMethod,
      grandTotal: placedOrder.grandTotal,
      items: placedOrder.items || [],
    });

    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="rounded-3xl bg-white p-7 sm:p-10 border border-[#EFE3E9] shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEF7F1] text-[#21593A]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#21593A]">
                Order Placed Successfully
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#5A0D3F]">
                Thank you, {placedOrder.customerName}!
              </h1>
              <p className="mt-1 text-sm text-[#4E2A3E]">
                Your order code is{' '}
                <strong className="font-mono text-[#5A0D3F] bg-[#F8EEF2] px-2 py-0.5 rounded">
                  {placedOrder.orderCode}
                </strong>
                . Our team will verify and pack your styles shortly.
              </p>
            </div>
          </div>

          {placedOrder.paymentMethod === 'upi_manual' && (
            <div className="mt-6 rounded-2xl border border-[#DFB968] bg-[#FDF7E8] p-4 text-xs text-[#563B0A] space-y-1.5">
              <p className="font-semibold text-sm">Next Step for UPI / GPay Payment:</p>
              <p>
                Tap the WhatsApp button below to share your order summary directly with STARLITES
                CLOTHING (<strong>+91 8807732182</strong>) so we can send our official store UPI QR
                and confirm your payment immediately.
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 border-y border-[#EFE3E9] py-5 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7A5B6B]">
                Delivery Details
              </p>
              <p className="mt-1.5 font-semibold text-[#2A1121]">{placedOrder.customerName}</p>
              <p className="text-xs text-[#4E2A3E]">{placedOrder.address}</p>
              <p className="text-xs text-[#4E2A3E]">
                {placedOrder.city} – {placedOrder.pincode}
              </p>
              <p className="mt-1 text-xs text-[#4E2A3E] tabular-nums">
                Mobile: {placedOrder.phone}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7A5B6B]">
                Order Summary
              </p>
              <p className="mt-1.5 text-xs text-[#4E2A3E]">
                Payment:{' '}
                <strong className="text-[#2A1121]">
                  {placedOrder.paymentMethod === 'upi_manual'
                    ? 'UPI / GPay (WhatsApp Confirm)'
                    : 'Cash on Delivery (COD)'}
                </strong>
              </p>
              <p className="mt-1 text-xs text-[#4E2A3E] tabular-nums">
                Items: <strong>{placedOrder.itemCount}</strong> · Shipping:{' '}
                <strong>
                  {placedOrder.shippingFee === 0 ? 'FREE' : formatINR(placedOrder.shippingFee)}
                </strong>
              </p>
              <p className="mt-2 text-base font-bold text-[#5A0D3F] tabular-nums">
                Grand Total: {formatINR(placedOrder.grandTotal)}
              </p>
            </div>
          </div>

          {placedOrder.items && placedOrder.items.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7A5B6B]">
                Ordered Styles
              </p>
              {placedOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs py-2 border-b border-[#F6EDF1]"
                >
                  <span className="text-[#2A1121] font-medium">
                    {item.productName} ({item.size}, {item.colorName}) × {item.quantity}
                  </span>
                  <span className="font-semibold text-[#5A0D3F] tabular-nums">
                    {formatINR(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#21593A] px-6 py-3 text-xs font-semibold text-white hover:bg-[#19452D] transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Send Order on WhatsApp (+91 8807732182)</span>
            </a>

            <button
              type="button"
              onClick={() => onNavigate({ view: 'orders', orderCode: placedOrder.orderCode })}
              className="inline-flex items-center gap-2 rounded-full border border-[#5A0D3F] px-6 py-3 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
            >
              <PackageCheck className="h-4 w-4" />
              <span>Track Order Status</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ view: 'home' })}
              className="rounded-full border border-[#E5D3DC] px-6 py-3 text-xs font-semibold text-[#4E2A3E] hover:bg-[#F8EEF2]"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h1 className="font-serif text-3xl font-semibold text-[#5A0D3F]">Checkout</h1>
        <p className="mt-2 text-sm text-[#7A5B6B]">
          Your shopping bag is currently empty. Add styles to your bag before checking out.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate({ view: 'shop', category: 'all' })}
            className="rounded-full bg-[#5A0D3F] px-7 py-3 text-sm font-semibold text-white hover:bg-[#7A1554]"
          >
            Explore Collections
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'orders' })}
            className="rounded-full border border-[#5A0D3F] px-7 py-3 text-sm font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
          >
            Track Existing Order
          </button>
        </div>
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

      {/* Account Choice Banner: Both Login & Direct Guest Checkout Enabled */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#EFE3E9] bg-white px-5 py-4">
        {authState.user ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF7F1] text-[#21593A]">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#2A1121]">
                Signed in as {authState.user.displayName || authState.user.email}
              </p>
              <p className="text-[11px] text-[#7A5B6B]">
                This order will be saved to your account so you can view &amp; track it anytime.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold text-[#5A0D3F]">
                Express Guest Checkout Enabled — Buy directly without login
              </p>
              <p className="mt-0.5 text-[11px] text-[#7A5B6B]">
                Prefer to save your address and order history? Sign in with Google, or continue
                straight below as a guest.
              </p>
            </div>
            <button
              type="button"
              disabled={signingIn}
              onClick={handleGoogleSignIn}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#5A0D3F] bg-[#F8EEF2] px-4 py-2 text-xs font-semibold text-[#5A0D3F] hover:bg-[#5A0D3F] hover:text-white transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{signingIn ? 'Signing in...' : 'Sign in with Google (Optional)'}</span>
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Shipping & Payment Form */}
        <form
          onSubmit={handlePlaceOrder}
          className="lg:col-span-7 rounded-3xl bg-white p-6 sm:p-8 border border-[#EFE3E9] space-y-6"
          noValidate
        >
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#5A0D3F]">
              Delivery &amp; Payment
            </h1>
            <p className="mt-1 text-xs text-[#7A5B6B]">
              Complete your shipping details to place your order with STARLITES CLOTHING.
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
                Mobile / WhatsApp Number *
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
              placeholder="House / Flat No., Street, Area, Landmark"
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
                PIN Code *
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

          <div>
            <label htmlFor="chk-notes" className="block text-xs font-semibold text-[#2A1121] mb-1.5">
              Order Notes (Optional)
            </label>
            <input
              id="chk-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Preferred delivery time or alteration request"
              className="w-full rounded-xl border border-[#DFC9D4] bg-[#FDFBF9] px-4 py-2.5 text-sm focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Payment Method Selection (Option A: COD + Manual UPI/WhatsApp) */}
          <div className="pt-4 border-t border-[#EFE3E9]">
            <h2 className="text-sm font-semibold text-[#2A1121] mb-1">Select Payment Option</h2>
            <p className="text-xs text-[#7A5B6B] mb-3">
              Pay conveniently on delivery or confirm directly via UPI / WhatsApp with our store.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  paymentMethod === 'cod'
                    ? 'border-[#5A0D3F] bg-[#F8EEF2] text-[#5A0D3F]'
                    : 'border-[#E5D3DC] bg-white text-[#4E2A3E] hover:border-[#5A0D3F]/60'
                }`}
              >
                <Truck className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">Cash on Delivery (COD)</p>
                  <p className="mt-0.5 text-[11px] opacity-85">
                    Pay in cash or UPI when your order arrives.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi_manual')}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  paymentMethod === 'upi_manual'
                    ? 'border-[#5A0D3F] bg-[#F8EEF2] text-[#5A0D3F]'
                    : 'border-[#E5D3DC] bg-white text-[#4E2A3E] hover:border-[#5A0D3F]/60'
                }`}
              >
                <Smartphone className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">UPI / GPay via WhatsApp</p>
                  <p className="mt-0.5 text-[11px] opacity-85">
                    Place order &amp; receive our UPI QR on WhatsApp.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#5A0D3F] py-3.5 px-6 text-sm font-semibold text-white hover:bg-[#7A1554] transition-colors disabled:opacity-60"
          >
            {submitting
              ? 'Placing Your Order...'
              : `Place Order · ${formatINR(totals.grandTotal)}`}
          </button>
        </form>

        {/* Right: Bag Summary */}
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
                    <p className="text-xs font-semibold text-[#2A1121] truncate">{product.name}</p>
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
              <span>Total Payable</span>
              <span className="tabular-nums">{formatINR(totals.grandTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
