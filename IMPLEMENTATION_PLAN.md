# Precision POS — Implementation Plan

> **Based on:** `precision-pos-native-prd.md`
> **Date:** 2026-07-26
> **Status:** Draft — ready for review

---

## Overview

Greenfield React Native (Expo SDK 54) project that ports the existing Precision POS PWA to a native mobile app. Reuses the Supabase backend as-is (schema, RPCs, RLS policies) while rebuilding the UI layer natively with React Navigation, NativeWind, and native barcode scanning via VisionCamera.

**Target:** Android-first (primary hardware), iOS secondary.

---

## Folder Structure (proposed)

```
pos-native/
├── app.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── global.css
├── assets/
│   ├── splash.png
│   ├── icon.png
│   └── adaptive-icon.png
├── src/
│   ├── app/
│   │   ├── RootNavigator.tsx        # Auth-gated root navigator
│   │   ├── AuthStack.tsx            # Login screen stack
│   │   └── MainTabs.tsx             # Bottom tab navigator
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── pos/
│   │   │   ├── POSScreen.tsx
│   │   │   └── CheckoutModal.tsx
│   │   ├── inventory/
│   │   │   ├── InventoryScreen.tsx
│   │   │   ├── AddProductScreen.tsx
│   │   │   ├── EditProductScreen.tsx
│   │   │   └── ProductFormScreen.tsx
│   │   └── transactions/
│   │       ├── TransactionsScreen.tsx
│   │       └── OrderDetailScreen.tsx
│   ├── components/
│   │   ├── BarcodeScanner.tsx        # Reusable scanner with viewfinder
│   │   ├── Cart.tsx                  # Cart with quantity steppers
│   │   ├── ProductSearchBar.tsx
│   │   └── ... (other shared components)
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client singleton
│   │   └── constants.ts             # App-wide constants
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRole.ts
│   │   ├── useCart.ts
│   │   ├── useProducts.ts
│   │   ├── useCheckout.ts
│   │   ├── useInventory.ts
│   │   ├── useOrders.ts
│   │   ├── useBarcodeDuplicateCheck.ts
│   │   └── useCameraPermission.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── database.ts              # Supabase schema types
│   └── utils/
│       └── image.ts                 # Image compression helpers
```

---

## Phase 1 — Project Scaffold & Foundation

### Step 1 — Initialize Expo project

```bash
npx create-expo-app@latest pos-native --template blank-typescript
cd pos-native
```

Configure `app.json` with proper Android package name, iOS bundle identifier, and app name "Precision POS".

### Step 2 — Install core dependencies

```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context

# Supabase
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage

# Styling
npx expo install nativewind tailwindcss react-native-reanimated react-native-gesture-handler

# Icons
npx expo install lucide-react-native

# Others
npx expo install expo-status-bar
```

### Step 3 — Configure NativeWind + Tailwind

1. Create `tailwind.config.js` extending with NativeWind preset:
   ```js
   // tailwind.config.js
   const { hairlineWidth } = require('nativewind/theme');
   module.exports = {
     content: ['./src/**/*.{ts,tsx}', './App.tsx'],
     presets: [require('nativewind/preset')],
     theme: {
       extend: {
         colors: {
           // Match existing PWA light theme
         },
       },
     },
     plugins: [],
   };
   ```

2. Update `metro.config.js` with NativeWind CSS-to-RN transform.

3. Update `babel.config.js` with NativeWind plugin.

4. Create `global.css`:
   ```css
   @tailwind utilities;
   ```

5. Import `global.css` in `App.tsx`.

### Step 4 — Set up Supabase client

File: `src/lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Step 5 — TypeScript schema types

File: `src/types/database.ts`

Manually typed or generated from Supabase. Key tables:
- `products` — id, barcode, sku, name, description, price (int), cost (int), image_url, created_at, updated_at
- `inventory` — product_id, quantity_on_hand, reorder_threshold
- `orders` — id, payment_method, total, created_at
- `order_items` — id, order_id, product_id, quantity, unit_price

### Step 6 — Dev Client configuration

Add `expo-dev-client` plugin to `app.json`:
```json
{
  "expo": {
    "plugins": ["expo-dev-client"]
  }
}
```

---

## Phase 2 — Auth + Navigation Shell

### Step 7 — Auth context and hooks

**`src/contexts/AuthContext.tsx`**
- Provides `user`, `session`, `isLoading`, `signOut` to the app tree.
- On mount, calls `supabase.auth.getSession()`.
- Subscribes to `supabase.auth.onAuthStateChange` for real-time session changes.

**`src/hooks/useAuth.ts`**
- Convenience wrapper consuming `AuthContext`.

**`src/hooks/useRole.ts`**
- Reads user role from `session.user.user_metadata.role` or queries a `profiles` table.
- Returns `'admin' | 'staff'`.

### Step 8 — Login screen

**`src/screens/auth/LoginScreen.tsx`**
- Email + password inputs styled with NativeWind.
- "Sign In" button calls `supabase.auth.signInWithPassword()`.
- Error display for invalid credentials.
- Loading spinner during auth.
- Centered card layout with app logo/title area.

### Step 9 — Navigation structure

**`src/app/RootNavigator.tsx`**
- If `session` is null → show `AuthStack`.
- If `session` exists → show `MainTabs`.

**`src/app/AuthStack.tsx`**
- Native stack with single screen: `LoginScreen`.

**`src/app/MainTabs.tsx`**
- Bottom tab navigator with 3 tabs:
  | Tab | Label | Icon | Screen |
  |-----|-------|------|--------|
  | POS | POS | `shopping-cart` | `POSStack` |
  | Inventory | Inventory | `package` | `InventoryStack` |
  | Transactions | Transactions | `receipt` | `TransactionsStack` |
- Each tab wraps a native stack navigator for screen nesting.
- Admin-only UI elements toggled via `useRole()`.

---

## Phase 3 — Native Barcode Scanner (PoC)

### Step 10 — Install scanner dependencies

```bash
npx expo install react-native-vision-camera
npx expo install vision-camera-code-scanner
```

Add camera permissions to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "Precision POS needs camera access to scan barcodes."
        }
      ]
    ]
  }
}
```

### Step 11 — Build reusable scanner component

**`src/components/BarcodeScanner.tsx`**

Props:
- `isActive: boolean` — pause/resume scanning
- `onBarcodeScanned: (barcode: string) => void`
- `onClose?: () => void`

Features:
- `useCameraDevice('back')` — selects rear camera
- `useCameraPermission()` — checks/requests permission
- Frame processor with barcode plugin — continuous scan
- Viewfinder overlay (animated corner brackets)
- Torch toggle button
- Close button (X)

### Step 12 — Permission handling

**`src/hooks/useCameraPermission.ts`**
- Returns `{ hasPermission, requestPermission, isDenied }`.
- If permission denied → show rationale screen with settings button.

---

## Phase 4 — POS / Checkout Screen

### Step 13 — Cart state management

**`src/hooks/useCart.ts`**

State (via `useReducer`):
- `items: CartItem[]` — `{ product: Product, quantity: number }`

Actions:
- `ADD_ITEM(product)` — add or increment quantity (validate stock)
- `REMOVE_ITEM(productId)` — remove line
- `UPDATE_QUANTITY(productId, qty)` — set specific quantity
- `CLEAR_CART`

Derived values:
- `totalItems: number`
- `grandTotal: number` — sum of (price × quantity) for all items

### Step 14 — POS screen

**`src/screens/pos/POSScreen.tsx`**

Layout:
- Header with app name and "Scan" button
- Search bar → `ProductSearchBar` (debounced, queries `products` by name/barcode)
- Cart section (`Cart` component)
- Bottom bar: total + "Checkout" button

Scan button opens `BarcodeScanner` as a full-screen modal. On decode:
1. Query `products` table by barcode.
2. If found → `addItem(product)` to cart, show toast.
3. If not found → show "Product not found" toast + manual entry option.

Manual barcode entry: numeric input in POS header → same lookup logic.

### Step 15 — Cart component

**`src/components/Cart.tsx`**

- FlatList of cart items.
- Each row: product thumbnail, name, quantity stepper (+/-), line total, remove (swipe or X).
- Quantity capped at `inventory.quantity_on_hand`.
- Empty state illustration + "Scan or search items to start" text.

### Step 16 — Checkout flow

**`src/screens/pos/CheckoutModal.tsx`**

1. Payment method selector: 3 large buttons — Cash, Card, QR/E-Wallet.
2. Shows order summary: item count, grand total.
3. On selection → calls `supabase.rpc('process_checkout', payload)`.
4. Success → clear cart, dismiss modal, show receipt summary toast.
5. Error → show error message (e.g., "Insufficient stock for Product X").

### Step 17 — Realtime stock updates

In `POSScreen`, subscribe to `inventory` table changes via `supabase.channel()` to keep displayed stock levels fresh.

---

## Phase 5 — Add/Edit Product Screen

### Step 18 — Product form

**`src/screens/inventory/ProductFormScreen.tsx`**

Reusable form for both add and edit. Mode determined by route params.

Fields:
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| Name | TextInput | Required | |
| Barcode | TextInput + "Scan" button | At least one of barcode/SKU | Scan → autofill → trigger duplicate check |
| SKU | TextInput | At least one of barcode/SKU | |
| Price | Numeric input | Required, > 0 | Rupiah (integer, no decimals) |
| Cost | Numeric input | Optional, >= 0 | |
| Stock Quantity | Numeric input | Required for new products | Maps to `inventory.quantity_on_hand` |
| Description | Multiline TextInput | Optional | |
| Image | Image picker + camera | Optional | See Step 20 |

### Step 19 — Scan-to-fill barcode

"Scan Barcode" button next to the barcode field opens `BarcodeScanner`. On decode:
1. Fill barcode field with decoded value.
2. Immediately trigger duplicate check (Step 20).

### Step 20 — Real-time duplicate barcode check

**`src/hooks/useBarcodeDuplicateCheck.ts`**

- Watches barcode field value (debounced 300ms).
- Queries `supabase.from('products').select('id, name').eq('barcode', value)`.
- If match found → show inline warning: "⚠ Product with barcode [value] already exists: [name]"
- If editing the same product, exclude self from match.

### Step 21 — Image handling

**`src/utils/image.ts`**

```ts
export async function compressImage(uri: string): Promise<string> {
  // Use expo-image-manipulator
  // Resize to max 1000px on longest dimension
  // JPEG quality 0.8
  // Return compressed URI
}
```

Flow:
1. User taps "Take Photo" or "Choose from Gallery".
2. `expo-image-picker` or VisionCamera returns a URI.
3. Call `compressImage()` to get compressed URI.
4. Upload to Supabase Storage bucket `product-images`:
   ```
   supabase.storage.from('product-images').upload(filePath, file, { upsert: true })
   ```
5. Get public URL: `supabase.storage.from('product-images').getPublicUrl(path)`.
6. Save URL to `image_url` field on save.

### Step 22 — Save logic

**Add:**
1. Validate form.
2. `supabase.from('products').insert({...})` → get new product ID.
3. `supabase.from('inventory').insert({ product_id, quantity_on_hand, reorder_threshold: 5 })`.
4. Navigate back to inventory list.

**Edit:**
1. Validate form.
2. `supabase.from('products').update({...}).eq('id', id)`.
3. `supabase.from('inventory').update({...}).eq('product_id', id)`.
4. Navigate back.

Catch and display DB constraint errors (duplicate barcode/SKU).

---

## Phase 6 — Inventory Dashboard + Transactions Screen

### Step 23 — Inventory list

**`src/screens/inventory/InventoryScreen.tsx`**

- `FlatList` with product cards: image thumbnail, name, SKU/barcode, stock level.
- Stock color coding:
  - 🟢 Green: `quantity_on_hand > reorder_threshold`
  - 🟡 Yellow: `quantity_on_hand === reorder_threshold`
  - 🔴 Red: `quantity_on_hand < reorder_threshold`
- Pull-to-refresh.
- Search/filter bar at top (by name or barcode).
- FAB "+" button → navigate to AddProduct.
- Tap product card → navigate to EditProduct.

### Step 24 — Realtime updates

Subscribe to `inventory` and `products` tables to reflect changes from POS checkout live.

### Step 25 — Transaction history

**`src/screens/transactions/TransactionsScreen.tsx`**

- `FlatList` of orders: date, total (Rp), payment method, item count.
- Filter bar: date range (start/end picker) + payment method dropdown.
- Tap row → navigate to `OrderDetailScreen`.

### Step 26 — Order detail

**`src/screens/transactions/OrderDetailScreen.tsx`**

- Receipt-style layout.
- Header: order ID, date, payment method.
- Line items table: product name, qty, unit price, subtotal.
- Footer: grand total.
- Print/share option (deferred).

---

## Phase 7 — Polish, Error Handling & Release Build

### Step 27 — Error boundaries & loading states

- Wrap each screen in error boundary.
- Loading skeletons (not just spinners) for list screens.
- Network error toasts via a lightweight toast library.
- Graceful handling: network down, RLS violations, constraint errors.

### Step 28 — Theme consistency

- Define color palette in `tailwind.config.js` matching PWA light theme.
- Typography scale (header, body, caption, etc.).
- Consistent spacing, border radius, shadow.

### Step 29 — Android release build

1. Configure `app.json` with icons and splash screen.
2. Generate Android keystore.
3. Build via EAS Build:
   ```bash
   eas build --platform android --profile production
   ```
   Or locally:
   ```bash
   npx expo run:android --variant release
   ```
4. Test APK on actual store hardware.

### Step 30 — Documentation

Update project `README.md` with:
- Setup instructions
- Required environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- Build commands
- Dev workflow

---

## Key Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | **VisionCamera + `vision-camera-code-scanner`** as barcode plugin | Community-standard, maintained, works with frame processors. Can fall back to MLKit if close-range issues persist on target hardware. |
| D2 | **Expo Dev Client** (not bare workflow) | Preserves Expo tooling (EAS Build, config plugins) while supporting native VisionCamera modules. |
| D3 | **Android-first** — iOS config added but not tested in v1 | Per PRD — primary hardware target is Android. iOS config (permissions, bundle ID) included to avoid rework. |
| D4 | **Cart state via React Context + `useReducer`** | Single-purpose cart scoped to POS screen tree. No need for Redux/Zustand bloat. |
| D5 | **No offline support** in this phase | Explicitly excluded by PRD. Assume online connectivity at checkout. |

---

## Open Questions

1. **User roles** — Are admin/staff roles stored in `user.user_metadata.role` or in a separate `profiles` table? This affects how `useRole` queries.
2. **`process_checkout` RPC signature** — Need exact parameter schema (`p_items` structure) from the existing Supabase RPC or web app source code before implementing Phase 4.
3. **Barcode scanner validation** — Recommend testing both `vision-camera-code-scanner` and a CodeScanner-based approach on the target Android hardware during Phase 3 to confirm close-range autofocus reliability.
4. **Coexistence period** — The PRD mentions PWA and native app may coexist. Should the native app use a different Supabase anon key or the same one? (Same is fine if RLS policies handle it.)

---

## Dependencies Summary

```json
{
  "dependencies": {
    "@react-navigation/native": "^7.x",
    "@react-navigation/bottom-tabs": "^7.x",
    "@react-navigation/native-stack": "^7.x",
    "@supabase/supabase-js": "^2.x",
    "@react-native-async-storage/async-storage": "^2.x",
    "react-native-vision-camera": "^4.x",
    "vision-camera-code-scanner": "^1.x",
    "nativewind": "^4.x",
    "tailwindcss": "^3.x",
    "react-native-reanimated": "^3.x",
    "react-native-gesture-handler": "^2.x",
    "react-native-screens": "^4.x",
    "react-native-safe-area-context": "^5.x",
    "lucide-react-native": "^0.x",
    "expo-image-picker": "~16.x",
    "expo-image-manipulator": "~13.x",
    "expo-dev-client": "~5.x",
    "expo-status-bar": "~2.x"
  }
}
```
