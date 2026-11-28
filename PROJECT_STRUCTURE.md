# Celestia Jewels — Project Structure, Screens & Roles

This document describes the folder structure, screens, navigation, services, and conventions of the `celestia_app` Expo/React Native mobile application.

---

## 1. Root Files & Configuration

| File | Role |
| :--- | :--- |
| `app.json` | Expo configuration (app name, bundle/package IDs, adaptive icon, `expo-splash-screen` plugin, EAS project ID). |
| `eas.json` | EAS Build profiles (`development`, `preview` APK, `production` AAB) and `EXPO_PUBLIC_*` environment variables. |
| `package.json` | Dependencies (`expo ~58`, `react-native 0.88`, `@react-navigation/*`, `zustand`, `@tanstack/react-query`) and scripts. |
| `tsconfig.json` | TypeScript configuration and path aliases (`@/*` → `src/*`). |
| `babel.config.js` | Babel configuration with `babel-plugin-module-resolver`. |
| `AGENTS.md` / `CLAUDE.md` | AI agent & project development guidelines. |

---

## 2. Folder Structure (`src/` & `assets/`)

```text
celestia_app/
├── assets/                          # App icon, favicon, splash-icon.png, Celestia_Logo.*
└── src/
    ├── app/                         # App entry point & navigation
    │   ├── App.tsx                  # Root component (QueryClientProvider, SafeAreaProvider, SplashScreen, Preloader, ToastContainer)
    │   └── navigation/
    │       ├── RootNavigator.tsx    # Native Stack Navigator
    │       ├── TabNavigator.tsx     # Bottom Tab Navigator with CustomFloatingTabBar
    │       └── types.ts             # MainTabParamList & RootStackParamList
    │
    ├── assets/                      # In-app bundled assets (Logo/Celestia_Logo.png, fonts, images)
    │
    ├── features/                    # Feature-based modules
    │   ├── home/                    # Home feed, categories, best sellers, new arrivals, product details
    │   │   ├── types.ts
    │   │   ├── components/          # AnnouncementMarquee.tsx, CategoryCard.tsx, ProductCard.tsx, ProductImagePreviewModal.tsx,       ProductQuickPreviewModal.tsx, index.ts
    │   │   ├── hooks/               # useHomeProducts.ts
    │   │   ├── screens/             # HomeScreen.tsx, NewArrivalsScreen.tsx, ProductDetailsScreen.tsx
    │   │   └── services/            # homeApi.ts
    │   ├── search/                  # Catalogue (Shop), Search screen, filters
    │   │   ├── types.ts
    │   │   ├── components/          # FilterModal.tsx, SearchBar.tsx, index.ts
    │   │   ├── hooks/               # useProductSearch.ts
    │   │   ├── screens/             # SearchScreen.tsx, ShopScreen.tsx
    │   │   └── services/            # searchApi.ts
    │   ├── cart/                    # Shopping cart, Zustand cartStore, Checkout
    │   │   ├── types.ts
    │   │   ├── components/          # CartItem.tsx, CartSummary.tsx, index.ts
    │   │   ├── hooks/               # useCart.ts
    │   │   ├── screens/             # CartScreen.tsx, CheckoutScreen.tsx
    │   │   └── store/               # cartStore.ts
    │   ├── orders/                  # Order history & tracking
    │   │   ├── types.ts
    │   │   ├── components/          # OrderListItem.tsx, index.ts
    │   │   ├── hooks/               # useOrders.ts
    │   │   ├── screens/             # OrdersScreen.tsx
    │   │   └── services/            # ordersApi.ts
    │   └── profile/                 # Auth (Password/OTP/Register), profile, saved addresses, about
    │       ├── types.ts
    │       ├── components/          # AboutView.tsx, CompleteProfileView.tsx, EditProfileView.tsx, LoginForm.tsx, PasswordLoginView.tsx, ProfileHeader.tsx, RegisterView.tsx, SavedAddressesView.tsx, SendOtpView.tsx, VerifyOtpView.tsx, index.ts
    │       ├── hooks/               # useAndroidPhoneHint.ts, useAuthSession.ts, useUserProfile.ts
    │       ├── screens/             # ProfileScreen.tsx
    │       └── store/               # userStore.ts
    │
    ├── services/                    # API client, React Query setup, Auth, Cart & Push Notification services
    │   ├── api/apiClient.ts         # Fetch wrapper with AsyncStorage token hydration
    │   ├── auth/                    # authApi.ts, authTypes.ts, useAuthQueries.ts, useSessionRestore.ts
    │   ├── cart/                    # cartApi.ts, cartSync.ts
    │   ├── notifications/           # notificationService.ts, notificationApi.ts, notificationRouting.ts, notificationCleanup.ts, notificationTokenSyncState.ts, pendingNotificationRoute.ts, index.ts
    │   ├── queryClient.ts           # Global TanStack React Query client
    │   ├── queryKeys.ts             # Centralized query key factory
    │   └── index.ts                 # Barrel export
    │
    └── shared/                      # Reusable UI components, constants, hooks, utilities
        ├── components/              # Button, Card, ChamferedBox, ChamferedCorners, ConfirmDialog, Preloader, Toast, UpdateModal, Drawers, FloatingNavigationBar
        ├── constants/               # env.ts, theme.ts (Colors, EyolizColors, Typography, Spacing, BorderRadius, Shadows)
        ├── hooks/                   # useDebounce.ts, useAppUpdate.ts
        └── utils/                   # formatCurrency.ts, versionCheckService.ts
```

---

## 3. Feature Module Format (Standard Pattern)

Each module inside `src/features/<feature>/` follows a consistent structure:

- **`screens/`**: Full-page screen components connected to navigation.
- **`components/`**: Feature-specific UI components (with `index.ts` barrel export).
- **`hooks/`**: Custom hooks encapsulating screen/feature logic.
- **`services/`**: Feature API calls wrapping `apiClient`.
- **`store/`**: Zustand stores with `AsyncStorage` persistence (where applicable).
- **`types.ts`**: TypeScript interfaces and types for that feature.

---

## 4. Screens & Navigation Map

### A. Bottom Tabs (`MainTabs` — `TabNavigator.tsx`)

| Tab Name | Screen File | Role |
| :--- | :--- | :--- |
| `Home` | `src/features/home/screens/HomeScreen.tsx` | Main storefront: announcement marquee, search trigger, 2-row category grid, Best Sellers & New Arrivals grids, category filtering, exit confirmation dialog. |
| `Shop` | `src/features/search/screens/ShopScreen.tsx` | Full wholesale catalogue with submit-only search, sticky search/category bar on scroll, infinite pagination, `FilterModal`, and `FloatingNavigationBar`. |
| `Cart` | `src/features/cart/screens/CartScreen.tsx` | Shopping bag with editable quantity stepper, "People Also Bought" recommendations, minimum order validation (`MIN_ORDER_AMOUNT`), and checkout trigger. |
| `Orders` | `src/features/orders/screens/OrdersScreen.tsx` | Order history & package tracking filtered by status (`All`, `Shipped`, `Delivered`, `Cancelled`). |
| `Account` | `src/features/profile/screens/ProfileScreen.tsx` | Auth-aware account portal: shows `LoginForm` when signed out, or Profile menu (`EditProfileView`, `SavedAddressesView`, `AboutView`, Logout) when signed in. |

### B. Stack Screens (`RootNavigator.tsx`)

| Route Name | Screen File | Role |
| :--- | :--- | :--- |
| `MainTabs` | `src/app/navigation/TabNavigator.tsx` | Hosts the 5-tab `CustomFloatingTabBar` layout. |
| `ProductDetails` | `src/features/home/screens/ProductDetailsScreen.tsx` | Product gallery with pinch/double-tap zoom (`ProductImagePreviewModal`), share link, quantity & add-to-cart animation, similar products, and infinite related feed. |
| `Checkout` | `src/features/cart/screens/CheckoutScreen.tsx` | Auth-guarded checkout: saved/new delivery address (`AddressDrawer`), optional GST details, brochure tier shipping & volume discounts, coupon drawer (`CouponDrawer`), and order placement. |
| `NewArrivals` | `src/features/home/screens/NewArrivalsScreen.tsx` | Dedicated 2-column grid of latest arrivals. |
| `Search` | `src/features/search/screens/SearchScreen.tsx` | Dedicated search screen with department tabs, popular searches, category/subcategory directory, and debounced live results. |
| `Cart` | `src/features/cart/screens/CartScreen.tsx` | Stack-pushed Cart screen (e.g., opened from `ProductDetails` or `Shop` header) with clean back navigation. |

---

## 5. Key Shared Components (`src/shared/components/`)

| Component | Role |
| :--- | :--- |
| `Preloader.tsx` | Branded `#FFF9F0` launch overlay displaying `src/assets/Logo/Celestia_Logo.png` and `CELESTIA JEWELS` text after native splash fades. |
| `PageLoadingScreen.tsx` | Full-screen breathing logo loader for loading states. |
| `FloatingNavigationBar.tsx` | Reusable chamfered bottom navigation bar used on stack-like screens (e.g., `ShopScreen`, `ProductDetailsScreen`). |
| `ChamferedBox.tsx` / `ChamferedCorners.tsx` | SVG 45-degree chamfered corner containers and corner-cut overlays. |
| `AddressDrawer.tsx` | Bottom-sheet modal for adding a shipping address with 6-digit pincode auto-lookup (`api.postalpincode.in`). |
| `CouponDrawer.tsx` | Bottom-sheet modal for entering promo codes or selecting available backend coupons. |
| `ConfirmDialog.tsx` | Branded confirmation modal (used for app exit and logout). |
| `Toast.tsx` | Global `showToast()` / `ToastContainer` notification system. |

---

## 6. State, Auth & API Conventions

- **Authentication**: `useSessionRestore()` runs once in `App.tsx` on boot to hydrate the token from `AsyncStorage` (`@celestia_auth_token`), verify via `GET /ecommerce/auth/me`, and populate `useUserStore`.
- **Cart Sync**: `useCartStore` persists guest items in `AsyncStorage` (`celestia_guest_cart`). Authenticated cart mutations sync in the background with `/ecommerce/cart` and `/ecommerce/coupons/available`. Upon explicit login/registration, `mergeGuestCartOnLogin()` merges local items into the server cart.
- **API Client**: `apiClient` (`src/services/api/apiClient.ts`) attaches the raw token (without `"Bearer "` prefix) in the `Authorization` header as required by the backend.
- **Splash Screen**: Native splash is configured once in `app.json` under `"plugins"` (`expo-splash-screen` using `./assets/splash-icon.png` and `#FFF9F0`) and dismissed in `App.tsx` on `SafeAreaProvider.onLayout`.
