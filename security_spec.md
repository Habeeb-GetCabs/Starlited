# STARLITES CLOTHING — Firestore Security Specification

## 1. Data Invariants
1. **Catalog Integrity**: Only verified store administrators (`isAdmin()`) may create, update, or delete `/products/{productId}` and `/media/{mediaId}`. Non-admin users can only view `active` or `out_of_stock` products (never `draft` items).
2. **Order Creation & Payment Integrity**:
   - Both signed-in verified customers and guest shoppers can place orders with initial status strictly locked to `'pending'` and `paymentMethod` in `['cod', 'upi_manual']`.
   - Every order must enforce `grandTotal == subtotal + shippingFee`, positive `itemCount` (`>= 1 && <= 30`), and server timestamps (`createdAt == request.time`, `updatedAt == request.time`).
   - Signed-in orders must bind `customerUid == request.auth.uid` and `isGuest == false`. Guest orders must have `isGuest == true` and `customerUid == null`.
3. **PII Isolation**:
   - `/orders/{orderId}` (which stores `customerName`, `phone`, `address`, `city`, `pincode`) can ONLY be read (`get` / `list`) by `isAdmin()` or the authenticated owner (`resource.data.customerUid == request.auth.uid`). Unauthenticated guests cannot read or list `/orders`.
   - Non-PII order status tracking is isolated to `/order_tracking/{orderCode}` (`get` by exact code only, `allow list: if false`).
4. **Order Line-Item Atomicity**:
   - `/orders/{orderId}/items/{itemId}` creation requires `existsAfter(/databases/$(database)/documents/orders/$(orderId))` so orphaned line items cannot exist without a parent order, and reads require `isAdmin()` or parent order ownership (`get(...).data.customerUid == request.auth.uid`).
5. **Immutable Audit & Terminal State Locking**:
   - `createdAt`, `orderCode`, `isGuest`, `customerUid`, and monetary totals (`subtotal`, `shippingFee`, `grandTotal`, `itemCount`) cannot be altered after order creation.
   - Once an order reaches `'delivered'` or `'cancelled'`, customers cannot modify it; only `isAdmin()` can correct states.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Non-admin product write**: Customer attempts `create`/`update`/`delete` on `/products/prod_hack`.
2. **Draft leakage**: Unauthenticated or customer user queries `/products` where `status == 'draft'` or `get` a `draft` product.
3. **Oversized ID poisoning**: Attacker creates `/orders/<200-char-invalid-id>` or uses spaces/slashes in IDs.
4. **Order status shortcutting**: Customer creates an order with `status: 'confirmed'` or `'delivered'` instead of `'pending'`.
5. **Shadow field injection**: Attacker creates an order with extra field `isPaidOverride: true` or `role: 'admin'`.
6. **Customer UID spoofing**: Signed-in user A creates an order with `customerUid: 'user_B'`.
7. **Guest PII scraping**: Unauthenticated user calls `list` or `get` on `/orders` or `/users`.
8. **Cross-user order read**: Signed-in user A reads `/orders/{orderOwnedByB}`.
9. **Client timestamp forgery**: Attacker sets `createdAt` to a backdated timestamp instead of `request.time`.
10. **Order total tampering**: Attacker creates an order with `grandTotal: 1` when `subtotal: 999, shippingFee: 0`.
11. **Privilege escalation in user profile**: Signed-in user writes `role: 'admin'` to `/users/{uid}` or writes to `/admins/{uid}`.
12. **Terminal order tamper**: Customer attempts to revert a `'delivered'` order back to `'pending'`.
