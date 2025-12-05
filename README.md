# Malar CRM

A comprehensive Customer Relationship Management (CRM) system built with Next.js, Firebase, and TypeScript for managing leads, orders, products, and users.

## 📁 Project Structure

```
Malar CRM/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── integration/          # External integration endpoints
│   │       ├── orders/           # Order API endpoints
│   │       ├── products/         # Product API endpoints
│   │       └── webhooks/         # Webhook handlers
│   ├── dashboard/                # Dashboard pages (contain full page logic)
│   │   ├── crm/                  # CRM tools page
│   │   ├── leads/                # Leads management page (full logic)
│   │   ├── orders/               # Orders management page (full logic)
│   │   ├── products/             # Products management page (full logic)
│   │   ├── users/                # Users management page (full logic)
│   │   ├── layout.tsx            # Dashboard layout
│   │   └── page.tsx              # Dashboard home (full logic)
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # React Components
│   ├── auth/                     # Authentication components
│   │   └── login-form.tsx        # Login form component
│   ├── crm/                      # CRM-specific components
│   │   ├── customer-segmentation.tsx
│   │   └── email-campaigns.tsx
│   ├── dashboard/                # Dashboard components (currently empty - logic in pages)
│   ├── layout/                   # Layout components
│   │   └── dashboard-layout.tsx   # Dashboard layout wrapper
│   ├── leads/                    # Lead components
│   │   └── lead-form.tsx         # Lead form
│   ├── orders/                   # Order components (currently empty - logic in pages)
│   ├── products/                 # Product components
│   │   └── product-form.tsx      # Product form
│   ├── users/                    # User components (currently empty - logic in pages)
│   ├── ui/                       # Reusable UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (50+ UI components)
│   └── theme-provider.tsx        # Theme context provider
│
├── docs/                         # Documentation
│   ├── examples/                 # Code examples
│   │   ├── ECOMMERCE_CLIENT_EXAMPLE.ts
│   │   └── ECOMMERCE_PRODUCT_HOOK_EXAMPLE.ts
│   ├── CREATE_USER_DOCUMENT.md
│   ├── DEPLOY_FIRESTORE_RULES.md
│   ├── ECOMMERCE_PRODUCT_INTEGRATION.md
│   ├── FIX_PRODUCT_PERMISSIONS.md
│   ├── INTEGRATION_GUIDE.md
│   ├── QUICK_FIX_PERMISSIONS.md
│   ├── REALTIME_PRODUCT_SYNC.md
│   └── VERCEL_DEPLOYMENT_GUIDE.md
│
├── hooks/                        # Custom React Hooks
│   ├── use-mobile.ts             # Mobile detection hook
│   └── use-toast.ts              # Toast notification hook
│
├── lib/                          # Library & Utilities
│   ├── firebase.ts               # Firebase initialization
│   ├── models/                   # TypeScript type definitions
│   │   └── types.ts              # All data models/interfaces
│   ├── services/                 # Business logic services
│   │   ├── auth-service.ts       # Authentication service
│   │   ├── crm-tools-service.ts   # CRM tools service
│   │   ├── email-service.ts      # Email service
│   │   ├── integration-service.ts # Integration service
│   │   ├── lead-service.ts       # Lead management service
│   │   ├── notification-service.ts # Notification service
│   │   ├── order-service.ts      # Order management service
│   │   ├── product-service.ts    # Product management service
│   │   └── user-service.ts       # User management service
│   └── utils.ts                  # Utility functions
│
├── public/                       # Static Assets
│   ├── icons/                    # App icons
│   │   ├── apple-icon.png
│   │   ├── icon-dark-32x32.png
│   │   ├── icon-light-32x32.png
│   │   └── icon.svg
│   └── images/                    # Images & placeholders
│       ├── placeholder-logo.png
│       ├── placeholder-logo.svg
│       ├── placeholder-user.jpg
│       ├── placeholder.jpg
│       └── placeholder.svg
│
├── .gitignore                    # Git ignore rules
├── components.json               # shadcn/ui configuration
├── firebase.json                 # Firebase configuration
├── firestore.rules               # Firestore security rules
├── next.config.mjs               # Next.js configuration
├── package.json                  # Dependencies & scripts
├── pnpm-lock.yaml                # Package lock file
├── postcss.config.mjs            # PostCSS configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file

```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Malarmedicals/CRM.git
cd CRM
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Gmail SMTP Configuration (for email sending)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Meta WhatsApp Cloud API Configuration (for WhatsApp notifications)
META_WHATSAPP_ACCESS_TOKEN=your-meta-access-token
META_WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
META_WHATSAPP_API_VERSION=v18.0
```

**Gmail Setup Instructions:**
1. Enable 2-Step Verification on your Google account: https://myaccount.google.com/security
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)" → Enter "Malar CRM"
   - Copy the 16-character password (no spaces)
   - Add it to `GMAIL_APP_PASSWORD` in your `.env.local` file
3. Use your full Gmail address for `GMAIL_USER`

**Meta WhatsApp Cloud API Setup Instructions:**
1. Create a Meta Business Account: https://business.facebook.com
2. Set up a Meta App:
   - Go to https://developers.facebook.com/apps
   - Create a new app or use existing app
   - Add "WhatsApp" product to your app
3. Get your credentials:
   - **Access Token**: 
     - Go to WhatsApp → API Setup in Meta for Developers
     - Copy the temporary access token (for testing)
     - For production, generate a permanent token with proper permissions
   - **Phone Number ID**:
     - Found in WhatsApp → API Setup
     - This is the ID of your WhatsApp Business phone number
   - **API Version**: Use `v18.0` (or latest version)
4. Add credentials to your `.env.local` file:
   - `META_WHATSAPP_ACCESS_TOKEN`: Your Meta access token
   - `META_WHATSAPP_PHONE_NUMBER_ID`: Your phone number ID
   - `META_WHATSAPP_API_VERSION`: API version (default: `v18.0`)
5. For testing: Use Meta's test numbers or verify your business number
6. For production: Complete business verification and get approved phone number

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Key Features

- **Lead Management**: Track and manage customer leads through the sales pipeline
- **Order Management**: Process and track orders with status updates
- **Product Management**: Manage product catalog with inventory tracking
- **User Management**: Admin panel for user roles and permissions
- **CRM Tools**: Customer segmentation and email campaigns
- **E-commerce Integration**: API endpoints for external integrations
- **Real-time Updates**: Firebase real-time database synchronization

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **State Management**: React Hooks
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React

## 📖 Documentation

All documentation is available in the `docs/` folder:

- **[Integration Guide](./docs/INTEGRATION_GUIDE.md)**: How to integrate with e-commerce sites
- **[Vercel Deployment](./docs/VERCEL_DEPLOYMENT_GUIDE.md)**: Step-by-step deployment guide
- **[Firestore Rules](./docs/DEPLOY_FIRESTORE_RULES.md)**: Security rules deployment
- **[Examples](./docs/examples/)**: Code examples for integration

## 🏗️ Architecture

### Component Organization

Components are organized by feature/module:
- **Feature components** (leads, orders, products, etc.) contain business logic
- **UI components** are reusable, generic components from shadcn/ui
- **Layout components** handle page structure and navigation

### Service Layer

All Firebase operations are abstracted into service files:
- Each service handles CRUD operations for its domain
- Services are located in `lib/services/`
- Type definitions are in `lib/models/types.ts`

### API Routes

API routes are organized by functionality:
- `/api/integration/*` - External integration endpoints
- All routes use Next.js App Router conventions

## 🔧 Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Structure Guidelines

1. **Components**: Place feature-specific components in their respective folders
2. **Services**: All database operations go through service files
3. **Types**: Centralize all TypeScript interfaces in `lib/models/types.ts`
4. **Utils**: Shared utility functions in `lib/utils.ts`

## 🚢 Deployment

See [VERCEL_DEPLOYMENT_GUIDE.md](./docs/VERCEL_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

Quick deploy to Vercel:
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## 📝 License

This project is private and proprietary.

## 🤝 Support

For issues or questions, please check the documentation in the `docs/` folder or contact the development team.

---

**Built with ❤️ for Malar Medicals**

