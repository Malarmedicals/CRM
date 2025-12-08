# Project Structure Documentation (Refactored)

This document outlines the **new** file structure and architectural organization of the Malar CRM project, following **Feature-Sliced Design**.

## 📂 Root Directory
The root is now cleaner, containing only configuration files and the `src` directory.

- **`src/`**: All source code.
- **`public/`**: Static assets.
- **`firestore.rules`**: Database security rules.
- **`next.config.mjs`**, **`tsconfig.json`**, **`tailwind.config.ts`**: Config files.

---

## 📂 `src/` (Source Code)

### `app/` (Application Routes)
Contains the Next.js App Router pages. These files are now thin wrappers that import features.
- `app/(auth)/login/page.tsx`
- `app/dashboard/products/page.tsx`
- `app/api/`: Server-side API routes.
- `app/layout.tsx`: Global layout.

### `features/` (Domain Logic)
The core of the application logic, grouped by business domain. This prevents "spaghetti code" by keeping related things together.

- **`auth/`**: Authentication logic (`auth-service.ts`, login forms).
- **`products/`**: Product management (`product-service.ts`, `product-form.tsx`, `inventory-service.ts`).
- **`orders/`**: Order processing (`order-service.ts`).
- **`users/`**: User management (`user-service.ts`).
- **`crm/`**: Customer relationship tools.
  - `crm-service.ts`, `lead-service.ts`, `email-service.ts`
  - Components: `banner-form.tsx`, `email-campaigns.tsx`, etc.

### `components/` (Shared UI)
Reusable "dumb" components that are used across multiple features.
- **`ui/`**: Shadcn UI primitives (Button, Input, Card, etc.).
- **`layout/`**: Global shell components (`dashboard-layout.tsx`, `sidebar.tsx`).

### `lib/` (Infrastructure)
Shared utilities and configuration that don't belong to a specific feature.
- **`firebase.ts`**: Firebase App initialization.
- **`models/types.ts`**: Global TypeScript interfaces (Note: These can be further split into features in the future).
- **`utils/`**: Helper functions.

### `styles/`
- **`globals.css`**: Global Tailwind directives and styles.

---

## 📁 Key Improvements
1.  **Cleaner Root**: No more clutter in the main folder.
2.  **Scalability**: Adding a new feature (e.g., "Analytics") just means adding a folder in `src/features/analytics`.
3.  **Maintainability**: Related code (Service + UI) is co-located.
