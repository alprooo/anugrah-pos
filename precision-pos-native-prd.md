# Precision POS — React Native App PRD
**Project codename:** `pos-native`
**Platform target:** Expo SDK 54 (React Native)
**Author:** Product/Engineering (Alfian)
**Status:** Draft v1

---

## 1. Background & Motivation

Precision POS currently exists as a PWA (Next.js 16, deployed on Vercel) used for retail checkout, barcode scanning, and inventory management for a stationery store. While functional, browser-based camera access (`getUserMedia`, ZXing, `BarcodeDetector`) has proven inconsistent across devices and browsers — close-range focus issues, Arc/Samsung Internet camera failures, and reliability/speed problems during scanning.

This project ports Precision POS to a native mobile app using **Expo SDK 54**, to gain reliable, hardware-accelerated camera and barcode scanning via native modules, while reusing existing business logic and Supabase backend as-is.

**This is treated as a separate codebase**, not an in-place refactor — the UI layer, navigation, and camera stack are rebuilt natively; backend logic (Supabase schema, RPCs, RLS policies) is reused unchanged.

---

## 2. Goals

- Reliable, fast barcode scanning (native camera APIs, no browser permission/focus quirks)
- Feature parity with the existing web POS: cart, checkout, inventory, product management
- Reuse existing Supabase backend (`products`, `inventory`, `orders`, `order_items`, `process_checkout` RPC) without schema changes
- Support both staff and admin roles (existing role-based auth)
- Ship on Android first (primary hardware target), iOS as secondary

## 3. Non-Goals

- No changes to Supabase schema, RLS policies, or `process_checkout` RPC logic
- No offline-first/local sync in this phase (assume online connectivity at checkout, matching current web app behavior)
- Not replacing the existing PWA — both may coexist during transition

---

## 4. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 54 (React Native, TypeScript) |
| Navigation | React Navigation (bottom tabs: POS / Inventory / Transactions) |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) — same instance as web app |
| Auth persistence | `@react-native-async-storage/async-storage` (replaces web's cookie-based `@supabase/ssr`) |
| Camera & scanning | `react-native-vision-camera` + a frame-processor barcode plugin (e.g. `vision-camera-code-scanner` or MLKit-based plugin) |
| Styling | NativeWind (Tailwind-equivalent for RN) to keep visual parity with existing light theme |
| Icons | `lucide-react-native` (same icon set as web) |
| Image handling | `expo-image-picker` (gallery) + `expo-camera` or VisionCamera photo capture, client-side compression before Supabase Storage upload |
| Build/dev | Expo Dev Client (required for VisionCamera — not compatible with plain Expo Go) |

---

## 5. Core Modules

### 5.1 Auth
- Login screen (email/password via Supabase Auth)
- Session persisted via AsyncStorage; auto-refresh on app open
- Role-based access (staff/admin) mirrored from existing RLS setup — UI conditionally shows admin-only screens (e.g. inventory edit, reports)

### 5.2 POS / Checkout
- Bottom-tab primary screen
- Native camera view with barcode scanning (replaces web's ZXing/BarcodeDetector dual-path)
- Manual barcode entry fallback (numeric input)
- Cart: add/remove items, quantity adjustment, stock validation against `inventory.quantity_on_hand`
- Checkout: payment method selector (cash / card / QR-e-wallet), calls existing `process_checkout` RPC unchanged
- Currency: Rupiah (Rp), no decimals — matches current web app convention

### 5.3 Barcode Scanning (native)
- `react-native-vision-camera` frame processor for real-time barcode detection
- Supported formats: EAN-13, EAN-8, UPC-A, UPC-E, CODE-128 (same as web app scope)
- Expected to resolve the close-range focus issues seen on web, since native camera APIs expose direct focus/zoom control unavailable via `getUserMedia`
- Manual tap-to-focus supported if exposed by chosen camera library

### 5.4 Add/Edit Product
- Form fields: name, barcode, SKU, price, cost, stock quantity, description, image
- **Scan-to-fill barcode**: tapping "Scan Barcode" opens native scanner, decoded value auto-fills the barcode field
- **Real-time duplicate check**: on decode, query `products` table by barcode; if it exists, warn immediately (before user starts typing rest of form) rather than at submit
- **Product image**: capture via camera or pick from gallery, compress client-side (JPEG quality 0.8, max dimension ~1000px) before upload to Supabase Storage `product-images` bucket; save resulting public URL to `image_url` column
- SKU/barcode uniqueness enforced by existing DB constraints (`products_barcode_key`, `products_sku_key`)

### 5.5 Inventory Dashboard
- Product list with image thumbnails, stock levels, reorder threshold indicators
- Realtime updates via Supabase Realtime subscription (same as web)

### 5.6 Transactions
- Order history list, filterable by date/payment method
- Read from `orders`/`order_items` tables

---

## 6. Data Model

No changes. Reuses existing schema:
- `products` (id uuid, barcode, sku, name, description, price int, cost int, image_url, timestamps)
- `inventory` (product_id, quantity_on_hand, reorder_threshold)
- `orders`, `order_items`
- RPC: `process_checkout(p_payment_method, p_items)`
- Storage bucket: `product-images` (public read, authenticated insert)

---

## 7. Open Questions / Decisions Needed

1. **Barcode scanning library** — confirm `react-native-vision-camera` + which frame-processor plugin (community code-scanner vs. MLKit-based) based on close-range focus performance testing on target Android hardware.
2. **Expo Dev Client vs. bare workflow** — Dev Client recommended to keep Expo tooling while supporting VisionCamera's native modules.
3. **iOS timeline** — confirm if iOS support is needed in v1 or deferred, since Android is the primary hardware target.
4. **Coexistence period** — how long the PWA and native app run in parallel before (if ever) retiring the PWA.

---

## 8. Milestones (proposed)

| Phase | Scope |
|---|---|
| 1 | Expo scaffold, Supabase client + auth wired up, basic navigation shell |
| 2 | Native barcode scanning proof-of-concept — validate close-range focus fix on real hardware |
| 3 | POS screen: cart, checkout, `process_checkout` integration |
| 4 | Add/Edit Product with scan-to-fill + image capture/compression |
| 5 | Inventory dashboard + Transactions screen |
| 6 | Internal testing on store hardware, polish, release build |

