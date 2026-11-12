import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { OperationType, auth, db, handleFirestoreError } from '../firebase';
import type {
  CartItem,
  Order,
  OrderItem,
  OrderPaymentMethod,
  OrderStatus,
  OrderTrackingInfo,
  Product,
} from '../types/store';
import { saveUserDeliveryDefaults } from './authService';
import { generateOrderCode, normalizeIndianPhone } from './orderLogic';
import { calculateCartTotals } from './pricingLogic';

const GUEST_ORDERS_KEY = 'starlites_guest_orders_v1';

function toIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function docToOrder(id: string, data: DocumentData): Order {
  return {
    id,
    orderCode: String(data.orderCode || id),
    isGuest: Boolean(data.isGuest),
    customerUid: typeof data.customerUid === 'string' ? data.customerUid : null,
    customerEmail: typeof data.customerEmail === 'string' ? data.customerEmail : null,
    customerName: String(data.customerName || ''),
    phone: String(data.phone || ''),
    address: String(data.address || ''),
    city: String(data.city || ''),
    pincode: String(data.pincode || ''),
    notes: String(data.notes || ''),
    paymentMethod: data.paymentMethod === 'upi_manual' ? 'upi_manual' : 'cod',
    status: (data.status || 'pending') as OrderStatus,
    itemCount: Number(data.itemCount) || 0,
    subtotal: Number(data.subtotal) || 0,
    shippingFee: Number(data.shippingFee) || 0,
    grandTotal: Number(data.grandTotal) || 0,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function loadGuestOrders(): Order[] {
  try {
    const raw = localStorage.getItem(GUEST_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGuestOrderLocally(order: Order): void {
  try {
    const existing = loadGuestOrders().filter((o) => o.orderCode !== order.orderCode);
    const next = [order, ...existing].slice(0, 20);
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(next));
  } catch {
    // Ignore localStorage quota failure
  }
}

export interface PlaceOrderParams {
  cartItems: CartItem[];
  productsById: Record<string, Product | undefined>;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  notes: string;
  paymentMethod: OrderPaymentMethod;
}

export async function placeCustomerOrder(params: PlaceOrderParams): Promise<Order> {
  const totals = calculateCartTotals(params.cartItems, params.productsById);
  if (totals.totalItems <= 0 || totals.subtotal <= 0) {
    throw new Error('Your shopping bag is empty or contains unavailable items.');
  }

  const currentUser = auth.currentUser;
  const isSignedInVerified = Boolean(currentUser && currentUser.emailVerified);
  const customerUid = isSignedInVerified && currentUser ? currentUser.uid : null;
  const customerEmail = isSignedInVerified && currentUser?.email ? currentUser.email.slice(0, 160) : null;
  const isGuest = !isSignedInVerified;

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const orderCode = generateOrderCode();
  const cleanPhone = normalizeIndianPhone(params.phone);
  const cleanName = params.customerName.trim().slice(0, 120);
  const cleanAddress = params.address.trim().slice(0, 400);
  const cleanCity = params.city.trim().slice(0, 100);
  const cleanPincode = params.pincode.trim().slice(0, 12);
  const cleanNotes = params.notes.trim().slice(0, 400);

  const batch = writeBatch(db);
  const orderRef = doc(db, 'orders', orderId);
  const trackingRef = doc(db, 'order_tracking', orderCode);

  batch.set(orderRef, {
    id: orderId,
    orderCode,
    isGuest,
    customerUid,
    customerEmail,
    customerName: cleanName,
    phone: cleanPhone,
    address: cleanAddress,
    city: cleanCity,
    pincode: cleanPincode,
    notes: cleanNotes,
    paymentMethod: params.paymentMethod,
    status: 'pending',
    itemCount: totals.totalItems,
    subtotal: totals.subtotal,
    shippingFee: totals.shippingFee,
    grandTotal: totals.grandTotal,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(trackingRef, {
    orderId,
    orderCode,
    status: 'pending',
    paymentMethod: params.paymentMethod,
    itemCount: totals.totalItems,
    grandTotal: totals.grandTotal,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const builtItems: OrderItem[] = [];
  params.cartItems.forEach((cartItem, index) => {
    const product = params.productsById[cartItem.productId];
    if (!product) return;
    const itemId = `item_${index + 1}_${Math.random().toString(36).slice(2, 6)}`;
    const unitPrice = Math.max(0, Math.round(product.sellingPrice));
    const quantity = Math.max(1, Math.min(50, Math.round(cartItem.quantity)));
    const lineTotal = unitPrice * quantity;

    const itemPayload: OrderItem = {
      id: itemId,
      orderId,
      customerUid,
      productId: product.id.slice(0, 128),
      productName: product.name.slice(0, 160),
      size: cartItem.size,
      colorName: cartItem.colorName.slice(0, 64),
      colorHex: cartItem.colorHex.slice(0, 16),
      unitPrice,
      quantity,
      lineTotal,
    };

    builtItems.push(itemPayload);
    batch.set(doc(db, 'orders', orderId, 'items', itemId), itemPayload);
  });

  if (builtItems.length === 0) {
    throw new Error('No valid products found in your shopping bag.');
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
  }

  const nowIso = new Date().toISOString();
  const createdOrder: Order = {
    id: orderId,
    orderCode,
    isGuest,
    customerUid,
    customerEmail,
    customerName: cleanName,
    phone: cleanPhone,
    address: cleanAddress,
    city: cleanCity,
    pincode: cleanPincode,
    notes: cleanNotes,
    paymentMethod: params.paymentMethod,
    status: 'pending',
    itemCount: totals.totalItems,
    subtotal: totals.subtotal,
    shippingFee: totals.shippingFee,
    grandTotal: totals.grandTotal,
    createdAt: nowIso,
    updatedAt: nowIso,
    items: builtItems,
  };

  if (isGuest) {
    saveGuestOrderLocally(createdOrder);
  } else if (customerUid) {
    saveUserDeliveryDefaults(customerUid, {
      displayName: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      city: cleanCity,
      pincode: cleanPincode,
    }).catch(() => {
      // Non-critical profile default update
    });
  }

  return createdOrder;
}

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const path = `orders/${orderId}/items`;
  try {
    const snap = await getDocs(collection(db, 'orders', orderId, 'items'));
    return snap.docs.map((d) => d.data() as OrderItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function lookupOrderTracking(orderCode: string): Promise<OrderTrackingInfo | null> {
  const cleanCode = orderCode.trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,32}$/.test(cleanCode)) {
    return null;
  }
  const path = `order_tracking/${cleanCode}`;
  try {
    const snap = await getDoc(doc(db, 'order_tracking', cleanCode));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      orderId: String(data.orderId || ''),
      orderCode: String(data.orderCode || cleanCode),
      status: (data.status || 'pending') as OrderStatus,
      paymentMethod: data.paymentMethod === 'upi_manual' ? 'upi_manual' : 'cod',
      itemCount: Number(data.itemCount) || 0,
      grandTotal: Number(data.grandTotal) || 0,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export function subscribeCustomerOrders(
  uid: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), where('customerUid', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs
        .map((d) => docToOrder(d.id, d.data()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function subscribeAdminOrders(
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'orders';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list = snapshot.docs
        .map((d) => docToOrder(d.id, d.data()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function updateOrderStatusAdmin(
  orderId: string,
  orderCode: string,
  nextStatus: OrderStatus,
  notes?: string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const batch = writeBatch(db);
    const orderUpdate: Record<string, unknown> = {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    };
    if (typeof notes === 'string') {
      orderUpdate.notes = notes.trim().slice(0, 400);
    }

    batch.update(doc(db, 'orders', orderId), orderUpdate);
    batch.update(doc(db, 'order_tracking', orderCode), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function cancelPendingCustomerOrder(
  orderId: string,
  orderCode: string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', orderId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'order_tracking', orderCode), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}
