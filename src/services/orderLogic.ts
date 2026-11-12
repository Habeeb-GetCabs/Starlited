import type { OrderItem, OrderPaymentMethod, OrderStatus } from '../types/store';

export interface CheckoutFormInput {
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  notes: string;
  paymentMethod: OrderPaymentMethod;
  itemCount: number;
}

export interface CheckoutValidationResult {
  valid: boolean;
  error?: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending Confirmation',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function generateOrderCode(now: Date = new Date()): string {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, '7');
  return `SL-${yy}${mm}${dd}-${rand}`;
}

export function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits.slice(0, 15);
}

export function validateCheckoutInput(input: CheckoutFormInput): CheckoutValidationResult {
  if (input.itemCount <= 0) {
    return { valid: false, error: 'Your shopping bag is empty.' };
  }
  if (input.itemCount > 30) {
    return { valid: false, error: 'A maximum of 30 items can be placed in a single online order.' };
  }

  const name = input.customerName.trim();
  if (name.length < 2 || name.length > 120) {
    return { valid: false, error: 'Please enter a valid full name (at least 2 characters).' };
  }

  const digits = normalizeIndianPhone(input.phone);
  if (digits.length < 10) {
    return { valid: false, error: 'Please enter a valid 10-digit mobile number for order updates.' };
  }

  const address = input.address.trim();
  if (address.length < 5 || address.length > 400) {
    return { valid: false, error: 'Please enter your complete street/door delivery address.' };
  }

  const city = input.city.trim();
  if (city.length < 2 || city.length > 100) {
    return { valid: false, error: 'Please enter your city and state.' };
  }

  const pincode = input.pincode.trim();
  if (pincode.length < 4 || pincode.length > 12) {
    return { valid: false, error: 'Please enter a valid delivery PIN code.' };
  }

  if (input.notes.trim().length > 400) {
    return { valid: false, error: 'Delivery notes must be 400 characters or fewer.' };
  }

  return { valid: true };
}

export function canCustomerCancelOrder(status: OrderStatus): boolean {
  return status === 'pending';
}

export function buildOrderWhatsAppUrl(params: {
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  paymentMethod: OrderPaymentMethod;
  grandTotal: number;
  items: Pick<OrderItem, 'productName' | 'size' | 'colorName' | 'quantity' | 'lineTotal'>[];
}): string {
  const paymentLabel =
    params.paymentMethod === 'upi_manual'
      ? 'UPI / GPay (Confirming on WhatsApp)'
      : 'Cash on Delivery (COD)';

  const itemLines = params.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.productName} (${item.size}, ${item.colorName}) x${item.quantity} - ₹${item.lineTotal.toLocaleString('en-IN')}`
    )
    .join('\n');

  const message = [
    `Hello STARLITES CLOTHING!`,
    `New Order Placed: *${params.orderCode}*`,
    ``,
    `*Items:*`,
    itemLines,
    ``,
    `*Total:* ₹${params.grandTotal.toLocaleString('en-IN')}`,
    `*Payment:* ${paymentLabel}`,
    `*Customer:* ${params.customerName} (${params.phone})`,
    `*Delivery:* ${params.address}, ${params.city} - ${params.pincode}`,
  ].join('\n');

  return `https://wa.me/918807732182?text=${encodeURIComponent(message)}`;
}
