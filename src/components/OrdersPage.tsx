import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  LogIn,
  Package,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';
import { signInWithGoogle, type AuthSessionState } from '../services/authService';
import { ORDER_STATUS_LABELS, canCustomerCancelOrder } from '../services/orderLogic';
import {
  cancelPendingCustomerOrder,
  fetchOrderItems,
  loadGuestOrders,
  lookupOrderTracking,
  subscribeCustomerOrders,
} from '../services/orderService';
import { formatINR } from '../services/pricingLogic';
import type { AppRoute, Order, OrderItem, OrderStatus, OrderTrackingInfo } from '../types/store';

interface OrdersPageProps {
  authState: AuthSessionState;
  initialOrderCode?: string;
  onNavigate: (route: AppRoute) => void;
}

const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-[#FDF4E6] text-[#8C5B12]',
  confirmed: 'bg-[#F8EEF2] text-[#5A0D3F]',
  packed: 'bg-[#EDE9F7] text-[#46297A]',
  shipped: 'bg-[#E6F2FA] text-[#1A557D]',
  delivered: 'bg-[#EEF7F1] text-[#21593A]',
  cancelled: 'bg-[#FDF0F3] text-[#A81D63]',
};

export const OrdersPage: React.FC<OrdersPageProps> = ({
  authState,
  initialOrderCode = '',
  onNavigate,
}) => {
  const [trackingQuery, setTrackingQuery] = useState(initialOrderCode);
  const [trackingResult, setTrackingResult] = useState<OrderTrackingInfo | null>(null);
  const [trackingSearched, setTrackingSearched] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [guestOrders, setGuestOrders] = useState<Order[]>(() => loadGuestOrders());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [itemsByOrderId, setItemsByOrderId] = useState<Record<string, OrderItem[]>>({});
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrderCode) {
      setTrackingQuery(initialOrderCode);
      setTrackingLoading(true);
      lookupOrderTracking(initialOrderCode)
        .then((res) => {
          setTrackingResult(res);
          setTrackingSearched(true);
        })
        .finally(() => setTrackingLoading(false));
    }
  }, [initialOrderCode]);

  useEffect(() => {
    if (!authState.ready || !authState.user || !authState.user.emailVerified) {
      setCustomerOrders([]);
      return;
    }
    const unsub = subscribeCustomerOrders(authState.user.uid, (orders) => {
      setCustomerOrders(orders);
    });
    return () => unsub();
  }, [authState.ready, authState.user]);

  // Refresh live statuses for recent guest orders saved on this device
  useEffect(() => {
    if (authState.user) return;
    const localOrders = loadGuestOrders();
    if (localOrders.length === 0) return;

    Promise.all(
      localOrders.map(async (ord) => {
        const live = await lookupOrderTracking(ord.orderCode).catch(() => null);
        return live ? { ...ord, status: live.status, updatedAt: live.updatedAt } : ord;
      })
    ).then(setGuestOrders);
  }, [authState.user]);

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingQuery.trim()) return;
    setTrackingLoading(true);
    try {
      const result = await lookupOrderTracking(trackingQuery);
      setTrackingResult(result);
      setTrackingSearched(true);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleToggleItems = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!itemsByOrderId[orderId]) {
      try {
        const loaded = await fetchOrderItems(orderId);
        setItemsByOrderId((prev) => ({ ...prev, [orderId]: loaded }));
      } catch {
        // Ignore transient fetch failure
      }
    }
  };

  const handleCancelOrder = async (order: Order) => {
    setBusyOrderId(order.id);
    try {
      await cancelPendingCustomerOrder(order.id, order.orderCode);
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <button
        type="button"
        onClick={() => onNavigate({ view: 'home' })}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A0D3F] hover:underline mb-5"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Storefront</span>
      </button>

      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#5A0D3F]">
          Orders &amp; Tracking
        </h1>
        <p className="mt-1 text-sm text-[#7A5B6B]">
          Track any order using your Order Code, or sign in to view your complete order history.
        </p>
      </div>

      {/* Track by Order Code */}
      <section className="rounded-3xl bg-white p-6 sm:p-7 border border-[#EFE3E9] mb-8">
        <h2 className="font-serif text-xl font-semibold text-[#5A0D3F] mb-3">
          Track by Order Code
        </h2>
        <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={trackingQuery}
              onChange={(e) => setTrackingQuery(e.target.value.toUpperCase())}
              placeholder="Enter Order Code (e.g., SL-261112-A1B2)"
              aria-label="Order Code"
              className="w-full rounded-full border border-[#DFC9D4] bg-[#FDFBF9] px-5 py-2.5 text-sm font-mono uppercase focus:border-[#5A0D3F] focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={trackingLoading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5A0D3F] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554] disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            <span>{trackingLoading ? 'Checking...' : 'Check Status'}</span>
          </button>
        </form>

        {trackingSearched && (
          <div className="mt-5">
            {trackingResult ? (
              <div className="rounded-2xl bg-[#FDFBF9] border border-[#EFE3E9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-[#5A0D3F]">
                      {trackingResult.orderCode}
                    </span>
                    <span
                      className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${
                        STATUS_BADGE_STYLES[trackingResult.status]
                      }`}
                    >
                      {ORDER_STATUS_LABELS[trackingResult.status]}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A5B6B]">
                    {trackingResult.itemCount} {trackingResult.itemCount === 1 ? 'item' : 'items'} ·{' '}
                    {trackingResult.paymentMethod === 'upi_manual'
                      ? 'UPI / WhatsApp'
                      : 'Cash on Delivery'}{' '}
                    · Placed {new Date(trackingResult.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#7A5B6B]">Order Total</p>
                  <p className="text-lg font-bold text-[#5A0D3F] tabular-nums">
                    {formatINR(trackingResult.grandTotal)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-[#FDF0F3] border border-[#E7B5C6] px-4 py-3 text-xs text-[#8C1D5E]">
                No order found for that code. Please double-check your Order Code or WhatsApp us at
                +91 8807732182.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Signed-In Customer Orders OR Recent Guest Orders */}
      {authState.user ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-[#5A0D3F]">
              Your Orders ({customerOrders.length})
            </h2>
            <span className="text-xs text-[#7A5B6B]">{authState.user.email}</span>
          </div>

          {customerOrders.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center border border-[#EFE3E9]">
              <Package className="mx-auto h-8 w-8 text-[#C59B48]" />
              <p className="mt-3 font-serif text-xl font-semibold text-[#5A0D3F]">
                No orders yet
              </p>
              <p className="mt-1 text-xs text-[#7A5B6B]">
                Once you place an order while signed in, it will appear here automatically.
              </p>
              <button
                type="button"
                onClick={() => onNavigate({ view: 'shop', category: 'all' })}
                className="mt-5 rounded-full bg-[#5A0D3F] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#7A1554]"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            customerOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const loadedItems = itemsByOrderId[order.id];

              return (
                <article
                  key={order.id}
                  className="rounded-3xl bg-white p-5 sm:p-6 border border-[#EFE3E9]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-sm font-bold text-[#5A0D3F]">
                          {order.orderCode}
                        </span>
                        <span
                          className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${
                            STATUS_BADGE_STYLES[order.status]
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <p className="text-xs text-[#7A5B6B]">
                        Placed on {new Date(order.createdAt).toLocaleString('en-IN')} ·{' '}
                        {order.paymentMethod === 'upi_manual'
                          ? 'UPI / WhatsApp'
                          : 'Cash on Delivery'}
                      </p>
                      <p className="text-xs text-[#4E2A3E]">
                        Deliver to: {order.customerName}, {order.address}, {order.city} –{' '}
                        {order.pincode}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
                      <span className="text-base font-bold text-[#5A0D3F] tabular-nums">
                        {formatINR(order.grandTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleItems(order.id)}
                        className="rounded-full border border-[#D4B4C4] px-4 py-1.5 text-xs font-semibold text-[#5A0D3F] hover:bg-[#F8EEF2]"
                      >
                        {isExpanded ? 'Hide Items' : `View Items (${order.itemCount})`}
                      </button>
                      {canCustomerCancelOrder(order.status) && (
                        <button
                          type="button"
                          disabled={busyOrderId === order.id}
                          onClick={() => handleCancelOrder(order)}
                          className="inline-flex items-center gap-1 rounded-full border border-[#E7B5C6] px-3.5 py-1.5 text-xs font-medium text-[#A81D63] hover:bg-[#FDF0F3]"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{busyOrderId === order.id ? 'Cancelling...' : 'Cancel'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#F4EAEF] space-y-2">
                      {loadedItems ? (
                        loadedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs py-1.5"
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
                </article>
              );
            })
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="rounded-2xl bg-[#F8EEF2] border border-[#E5D3DC] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-[#5A0D3F] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#5A0D3F]">
                  Sign in to access all your past orders across any device
                </p>
                <p className="text-[11px] text-[#4E2A3E] mt-0.5">
                  Guest orders placed from this browser also appear below with live status updates.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#5A0D3F] px-5 py-2 text-xs font-semibold text-white hover:bg-[#7A1554]"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign in with Google</span>
            </button>
          </div>

          {guestOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-semibold text-[#5A0D3F]">
                Recent Guest Orders on This Device
              </h2>
              {guestOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl bg-white p-5 border border-[#EFE3E9] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-[#5A0D3F]">
                        {order.orderCode}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-semibold ${
                          STATUS_BADGE_STYLES[order.status]
                        }`}
                      >
                        {order.status === 'delivered' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Truck className="h-3 w-3" />
                        )}
                        <span>{ORDER_STATUS_LABELS[order.status]}</span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#7A5B6B]">
                      {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} ·{' '}
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className="text-base font-bold text-[#5A0D3F] tabular-nums">
                    {formatINR(order.grandTotal)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
