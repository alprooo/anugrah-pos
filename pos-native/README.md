# Precision POS (Native)

A React Native (Expo SDK 57) point-of-sale application for retail checkout, barcode scanning, and inventory management. Built as a native companion to the existing Precision POS PWA, sharing the same Supabase backend.

## Tech Stack

- **Framework:** Expo SDK 57 (React Native, TypeScript)
- **Navigation:** React Navigation (bottom tabs + native stacks)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Barcode Scanning:** react-native-vision-camera v5
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Icons:** lucide-react-native
- **Auth Persistence:** @react-native-async-storage/async-storage

## Prerequisites

- Node.js 18+
- npm or yarn
- Android SDK (for Android builds)
- Xcode (for iOS builds — optional, Android-first)
- Expo CLI (`npm install -g expo-cli`)
- A Supabase project with the existing Precision POS schema

## Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> The `EXPO_PUBLIC_` prefix makes these variables available at runtime in Expo.

## Setup

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start

# Or run directly on Android (requires dev client build first)
npx expo run:android
```

## Development Build

Since this app uses `react-native-vision-camera` (native modules not available in Expo Go), you need a development build:

```bash
# Build the dev client
npx expo run:android

# For iOS (if needed)
npx expo run:ios
```

## Project Structure

```
src/
├── app/                  # Navigation & screen registry
│   ├── RootNavigator.tsx # Auth-gated root
│   ├── AuthStack.tsx     # Login flow
│   └── MainTabs.tsx      # Bottom tabs (POS / Inventory / Transactions)
├── screens/
│   ├── auth/             # LoginScreen
│   ├── pos/              # POSScreen, CheckoutModal
│   ├── inventory/        # InventoryScreen, ProductFormScreen
│   └── transactions/     # TransactionsScreen, OrderDetailScreen
├── components/           # Reusable UI (BarcodeScanner, Cart, ProductSearchBar, etc.)
├── hooks/                # Custom hooks (useCart, useCheckout, useProducts, etc.)
├── contexts/             # AuthContext
├── lib/                  # Supabase client, constants
├── types/                # TypeScript types (database.ts)
└── utils/                # Helpers (image.ts, toast.ts)
```

## Features

### Auth
- Email/password login via Supabase Auth
- Session persisted via AsyncStorage
- Auto-refresh on app open
- Role-based UI (admin/staff)

### POS / Checkout
- Native barcode scanning with VisionCamera
- Manual barcode entry fallback
- Product search by name/barcode/SKU
- Cart with quantity adjustment and stock validation
- Checkout with payment methods: Cash / Card / QR (E-Wallet)
- Calls existing Supabase `process_checkout` RPC

### Inventory Management
- Product list with stock level indicators (green/yellow/red)
- Pull-to-refresh + Realtime updates
- Add/Edit products with form validation
- Scan-to-fill barcode with real-time duplicate check
- Image capture (camera/gallery) → compress → upload to Supabase Storage

### Transactions
- Order history with date and payment method filters
- Receipt-style order detail view

## Build for Production

```bash
# Build Android APK/AAB via EAS
eas build --platform android --profile production

# Or build locally
npx expo run:android --variant release
```

## Architecture Notes

- **No changes to Supabase schema** — reuses existing `products`, `inventory`, `orders`, `order_items` tables and `process_checkout` RPC
- **No offline support** in this phase — assumes online connectivity at checkout
- **Android-first** — iOS support added but not fully tested

## License

Private — Anugrah POS
