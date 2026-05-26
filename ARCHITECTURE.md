# Frontend Architecture Documentation

## Overview

Modern Next.js 14+ e-commerce frontend with React, TypeScript, Redux Toolkit, and Tailwind CSS.

---

## 📁 Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth route group (login, register)
│   ├── (customer)/              # Customer-facing pages
│   │   ├── page.tsx             # Homepage
│   │   ├── layout.tsx           # Customer layout
│   │   ├── products/
│   │   │   ├── page.tsx         # Product listing
│   │   │   └── [slug]/          # Product detail
│   │   │       ├── page.tsx
│   │   │       ├── components/  # Co-located components
│   │   │       └── hooks/       # Co-located hooks
│   │   ├── checkout/
│   │   │   ├── page.tsx
│   │   │   ├── components/      # StepIndicator, ShippingStep, etc.
│   │   │   └── hooks/
│   │   └── ...
│   ├── admin/                   # Admin dashboard
│   └── api/                     # API routes
│
├── components/
│   ├── index.ts                 # Main barrel export
│   ├── ui/                      # shadcn/ui components
│   ├── common/                  # Shared UI components
│   │   ├── index.ts             # Barrel export
│   │   ├── EmptyState.tsx
│   │   ├── CardSkeleton.tsx
│   │   └── SkeletonGrid.tsx
│   ├── products/                # Product-related components
│   │   ├── index.ts
│   │   ├── ProductCard.tsx
│   │   └── BestSellers.tsx
│   ├── shop/                    # Shopping/filter components
│   │   ├── index.ts
│   │   ├── FilterSidebar.tsx
│   │   ├── ProductGrid.tsx
│   │   └── ActiveFilterChips.tsx
│   ├── admin/                   # Admin-specific components
│   │   ├── index.ts
│   │   └── StatusBadges.tsx
│   ├── effects/                 # Animation effects
│   │   ├── index.ts
│   │   └── MagneticButton.tsx
│   └── navigation/
│       └── CategoryNav.tsx
│
├── hooks/                       # Shared custom hooks
│   ├── index.ts                 # Barrel export
│   ├── useWishlist.ts
│   ├── useInView.ts
│   └── ...
│
├── lib/                         # Utilities & configurations
│   ├── index.ts                 # Barrel export
│   ├── api-utils.ts             # API response helpers
│   ├── admin-utils.ts           # Admin business logic
│   ├── animations.ts            # Framer Motion configs
│   ├── redux/                   # Redux store & slices
│   │   ├── hooks.ts
│   │   ├── store.ts
│   │   ├── authSlice.ts
│   │   └── cartSlice.ts
│   └── api/                     # Axios & base query
│       └── axiosBaseQuery.ts
│
├── services/                    # External services
│   └── api/                     # RTK Query APIs
│       ├── index.ts             # Barrel export
│       ├── productsApi.ts
│       ├── cartApi.ts
│       ├── ordersApi.ts
│       └── ... (21 total)
│
├── types/                       # Shared TypeScript types
│   ├── index.ts                 # Barrel export
│   ├── product.ts               # Product, ProductVariant, ShopFilters
│   ├── order.ts                 # Order, OrderItem, Cart
│   └── api.ts                   # PaginatedResponse, ApiError
│
├── constants/                   # Application constants
│   ├── index.ts                 # Barrel export
│   ├── order-status.ts          # ORDER_STATUS_CONFIG
│   └── routes.ts                # ROUTES
│
└── middleware.ts                # Next.js middleware (auth)
```

---

## 🔗 Import Patterns

### Barrel Exports (Recommended)

```typescript
// ✅ Good - Single import from barrel
import { EmptyState, CardSkeleton } from '@/components/common';
import { ProductCard, BestSellers } from '@/components/products';
import { FilterSidebar, ProductGrid } from '@/components/shop';
import { useWishlist } from '@/hooks';
import { ORDER_STATUS_CONFIG, ROUTES } from '@/constants';
import type { Product, Order } from '@/types';

// ❌ Avoid - Deep imports
import { EmptyState } from '@/components/common/EmptyState';
import { ProductCard } from '@/components/products/ProductCard';
```

### Path Aliases

```typescript
// ✅ Use @/* alias
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/lib/redux/hooks';

// ❌ Avoid relative paths when possible
import { Button } from '../../../components/ui/button';
```

---

## 📦 Key Constants

### Order Status Config

```typescript
import { ORDER_STATUS_CONFIG } from '@/constants';

// Usage
<span className={ORDER_STATUS_CONFIG.pending.color}>
  {ORDER_STATUS_CONFIG.pending.label}
</span>
```

### Routes

```typescript
import { ROUTES } from '@/constants';

// Usage
router.push(ROUTES.CART);
router.push(ROUTES.ADMIN.PRODUCTS);
router.push(ROUTES.PRODUCT_DETAIL('my-product'));
```

---

## 🎯 Type Usage

### Shared Types

```typescript
import type { Product, Order, Cart, ShopFilters } from '@/types';

// Product type includes:
// - id, name, slug, price, stock, isActive
// - media: ProductMedia[]
// - category?: ProductCategory
// - variants: ProductVariant[]
// - avgRating?: number | string (from API)
```

---

## 🏗️ Architecture Principles

1. **Co-location**: Components and hooks used by a single page live in that page's folder
2. **Barrel Exports**: Each folder exports its public API via `index.ts`
3. **Single Source of Truth**: Constants (routes, status configs) live in `constants/`
4. **Type Safety**: Shared types in `types/`, component-specific types inline
5. **DRY**: Utilities in `lib/`, shared logic in hooks

---

## 📊 File Size Guidelines

| Type | Max Lines | Notes |
|------|-----------|-------|
| Page | 250 | Split into components if larger |
| Component | 200 | Extract sub-components if larger |
| Hook | 150 | Single responsibility |
| Utility | 100 | Focused functions |

---

## 🧹 Refactoring Checklist

- [x] Create barrel exports for all component folders
- [x] Set up `constants/` directory
- [x] Set up `types/` directory with shared types
- [x] Extract `MagneticButton` to `effects/`
- [x] Update imports to use barrel exports
- [x] Remove unused imports
- [x] Standardize type usage

---

## 🚀 Benefits

1. **Cleaner Imports**: `import { X, Y } from '@/components/common'`
2. **Better IDE Support**: Auto-imports work better
3. **Easier Refactoring**: Move files without changing imports
4. **Clear Public API**: `index.ts` shows what's exported
5. **Type Safety**: Shared types reduce duplication
