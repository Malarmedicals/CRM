# Proposed Architecture Refactoring: Feature-Sliced Design

The following structure is recommended to improve scalability, maintainability, and code organization. It adopts the **Feature-Sliced Design** philosophy, where code is grouped by **business domain** (Feature) rather than **technical type**. It also introduces a `src` directory to keep the root clean.

## 🏗️ High-Level Structure

```
c:\Malar CRM\
├── public/                 # Static assets (favicons, images)
├── src/                    # Source code
│   ├── app/                # Application Routes (Next.js App Router)
│   ├── components/         # Shared / Global UI Components
│   ├── config/             # Environment & Constants
│   ├── features/           # BUSINESS LOGIC (Grouped by Domain)
│   ├── hooks/              # Global Hooks
│   ├── lib/                # Shared Utilities & Infrastructure
│   ├── types/              # Global Types
│   └── styles/             # Global Styles
├── .env.local
├── next.config.mjs
├── package.json
└── ...
```

---

## 📂 Detailed Breakdown

### 1. `src/features/` (The Core Change)
Instead of scattering code across `components/products`, `lib/services/product-service.ts`, and `lib/models/types.ts`, we co-locate everything related to a specific domain.

**Example: Product Feature**
```
src/features/products/
├── components/          # Product-specific UI
│   ├── product-form.tsx
│   ├── product-list.tsx
│   └── product-card.tsx
├── services/            # Product Data Fetching & Logic
│   └── product-service.ts
├── types/               # Product Interfaces
│   └── index.ts         # (Exports Product, ProductDetail, etc.)
└── index.ts             # Public API for this feature (barrels)
```

**Proposed Domains:**
- `src/features/auth/` (Login, User Session, Roles)
- `src/features/products/` (CRUD, Inventory Logic)
- `src/features/orders/` (Order Management, Status)
- `src/features/crm/` (Leads, Email, WhatsApp)
- `src/features/users/` (User Management, Profiles)
- `src/features/dashboard/` (Dashboard Analytics/Widgets)

### 2. `src/components/` (Shared UI)
Only "dumb" or truly global components go here.
- `src/components/ui/`: Shadcn UI primitives (Button, Card, Input).
- `src/components/layout/`: Global layouts (Sidebar, Header, Shell).
- `src/components/common/`: Common utilities (LoadingSpinner, ErrorBoundary, Logo).

### 3. `src/lib/` (Infrastructure)
Code that doesn't belong to a specific feature.
- `firebase.ts`: Firebase initialization.
- `utils.ts`: Helper functions (cn, date formatters).
- `api_client.ts`: Generic API wrappers (if any).

### 4. `src/app/` (Routing Layer)
Keep this thin. Pages should import features and layouts.
- `app/(auth)/login/page.tsx`
- `app/dashboard/products/page.tsx` 
  -> Imports `ProductList` from `@/features/products`

---

## 🔄 Migration Plan

1.  **Initialize `src/`**: Create the directory structure.
2.  **Move Primitives**: Move `components/ui` to `src/components/ui`.
3.  **Split Types**: Break down `lib/models/types.ts` into feature-specific files (`src/features/products/types.ts`, etc.).
4.  **Migrate Features**: One by one, move components and services into `src/features/xxx`.
    - *Example*: Move `product-form.tsx` and `product-service.ts` to `src/features/products`.
    - Update imports in those files.
5.  **Refactor Pages**: Update `app/` pages to import from the new locations.
6.  **Cleanup**: Remove the old `lib/services` and `components` folders.

This structure ensures that when you work on "Products", you have everything you need in one folder. It prevents the "spaghetti code" problem as the app grows.
