# CRM to E-commerce Integration Guide

This guide explains how to integrate your CRM with your e-commerce site using Firebase as the shared database.

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│   E-commerce    │◄────────►│      CRM        │
│      Site       │  API     │   (This App)    │
└─────────────────┘         └─────────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │  Firebase   │
              │  Firestore  │
              └─────────────┘
```

## Integration Methods

### Method 1: Shared Firebase Database (Recommended)

Both applications use the same Firebase project and access the same Firestore collections.

**Pros:**
- Real-time synchronization
- No API overhead
- Single source of truth

**Cons:**
- Both apps need Firebase SDK
- Security rules must be carefully configured

### Method 2: API-Based Integration

E-commerce calls CRM APIs for operations.

**Pros:**
- Clear separation of concerns
- Better security control
- Easier to scale independently

**Cons:**
- Requires API management
- Slight latency

### Method 3: Webhook-Based Integration

Real-time events trigger webhooks between systems.

**Pros:**
- Event-driven architecture
- Decoupled systems
- Real-time updates

**Cons:**
- More complex setup
- Requires webhook infrastructure

## Setup Instructions

### Step 1: Configure Environment Variables

Add to your `.env.local` in both CRM and E-commerce:

```env
# Firebase (same for both apps)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Integration API (for API-based method)
INTEGRATION_API_KEY=your-secure-api-key-here
WEBHOOK_SECRET=your-webhook-secret-here

# E-commerce URL (for webhooks)
ECOMMERCE_BASE_URL=http://localhost:3001
```

### Step 2: Choose Your Integration Method

#### Option A: Shared Firebase (Simplest)

1. **In your E-commerce app**, install Firebase:
```bash
npm install firebase
```

2. **Use the same Firebase config** as your CRM:
```typescript
// lib/firebase.ts (in e-commerce)
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... same as CRM
}

export const db = getFirestore(initializeApp(firebaseConfig))
```

3. **Read/write directly to Firestore**:
```typescript
// In e-commerce: Create order
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const orderRef = await addDoc(collection(db, 'orders'), {
  userId: 'user123',
  products: [...],
  totalAmount: 1000,
  status: 'pending',
  createdAt: new Date(),
})
```

#### Option B: API-Based Integration

1. **In your E-commerce app**, create a client to call CRM APIs:

```typescript
// lib/crm-client.ts (in e-commerce)
const CRM_API_KEY = process.env.NEXT_PUBLIC_CRM_API_KEY
const CRM_BASE_URL = process.env.NEXT_PUBLIC_CRM_BASE_URL

export const crmClient = {
  async createOrder(orderData: any) {
    const response = await fetch(`${CRM_BASE_URL}/api/integration/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CRM_API_KEY,
      },
      body: JSON.stringify(orderData),
    })
    return response.json()
  },

  async getProducts(category?: string) {
    const url = category 
      ? `${CRM_BASE_URL}/api/integration/products?category=${category}`
      : `${CRM_BASE_URL}/api/integration/products`
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': CRM_API_KEY,
      },
    })
    return response.json()
  },

  async updateProductStock(productId: string, quantity: number, operation: 'set' | 'increment' | 'decrement' = 'set') {
    const response = await fetch(`${CRM_BASE_URL}/api/integration/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CRM_API_KEY,
      },
      body: JSON.stringify({ productId, quantity, operation }),
    })
    return response.json()
  },
}
```

2. **Use in your e-commerce checkout**:
```typescript
// app/checkout/page.tsx (in e-commerce)
import { crmClient } from '@/lib/crm-client'

async function handleCheckout(cartItems: any[]) {
  const order = await crmClient.createOrder({
    userId: currentUser.id,
    products: cartItems.map(item => ({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount: calculateTotal(cartItems),
  })
  
  // Redirect to success page
}
```

#### Option C: Webhook-Based Integration

1. **In your E-commerce app**, create webhook endpoint:
```typescript
// app/api/webhooks/route.ts (in e-commerce)
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-webhook-signature')
  if (signature !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { event, data } = await request.json()

  switch (event) {
    case 'order.status.updated':
      // Update order status in e-commerce
      await updateOrderStatus(data.orderId, data.status)
      break
    case 'product.stock.updated':
      // Update product stock in e-commerce
      await updateProductStock(data.productId, data.stockQuantity)
      break
  }

  return NextResponse.json({ success: true })
}
```

2. **In CRM**, send webhooks when events occur:
```typescript
// When order status changes in CRM
import { integrationService } from '@/lib/services/integration-service'

await integrationService.sendWebhook('order.status.updated', {
  orderId: order.id,
  status: order.status,
}, {
  apiKey: process.env.INTEGRATION_API_KEY!,
  baseUrl: process.env.ECOMMERCE_BASE_URL!,
  webhookSecret: process.env.WEBHOOK_SECRET!,
})
```

## Data Flow Examples

### Order Flow

1. **Customer places order in E-commerce**
   - E-commerce creates order in Firestore (or via API)
   - Order appears in CRM dashboard automatically

2. **Admin processes order in CRM**
   - Admin updates order status to "processing"
   - E-commerce receives webhook (or reads from Firestore)
   - Customer sees updated status

3. **Order shipped**
   - Admin updates status to "dispatched" in CRM
   - Tracking number added
   - E-commerce updates customer order page

### Product Inventory Flow

1. **Admin updates product in CRM**
   - Stock quantity changed
   - Price updated
   - E-commerce automatically reflects changes (Firestore listener or webhook)

2. **Customer purchases in E-commerce**
   - Stock decremented in real-time
   - CRM inventory updated automatically
   - Low stock alerts triggered in CRM

### Lead Generation Flow

1. **Customer submits contact form in E-commerce**
   - Webhook sent to CRM (or direct Firestore write)
   - Lead created in CRM
   - Sales team notified

2. **Sales team follows up in CRM**
   - Lead converted to customer
   - Customer data synced to e-commerce

## Security Considerations

### Firebase Security Rules

Update your Firestore security rules. A complete `firestore.rules` file is included in the project root. Deploy it using:

```bash
firebase deploy --only firestore:rules
```

Or copy the rules from `firestore.rules` file to Firebase Console > Firestore Database > Rules.

**Complete Security Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin or manager
    function isAdminOrManager() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    // Users collection: Only admins/managers can read/write
    match /users/{userId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || isAdminOrManager());
      allow write: if isAdminOrManager();
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Orders: Users can read their own, admins can read all
    match /orders/{orderId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || isAdminOrManager());
      allow create: if request.auth != null;
      allow update, delete: if isAdminOrManager();
    }
    
    // Products: Public read, admin write
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdminOrManager();
    }
    
    // Leads: Admin read, public create
    match /leads/{leadId} {
      allow read: if isAdminOrManager();
      allow create: if true;
      allow update, delete: if isAdminOrManager();
    }
  }
}
```

### API Key Security

- Store API keys in environment variables
- Never expose API keys in client-side code
- Use different keys for different environments
- Rotate keys regularly

## Testing Integration

1. **Test Order Creation**:
```bash
curl -X POST http://localhost:3000/api/integration/orders \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "userId": "test-user",
    "products": [{"productId": "prod1", "productName": "Test", "quantity": 1, "price": 100}],
    "totalAmount": 100
  }'
```

2. **Test Product Fetch**:
```bash
curl http://localhost:3000/api/integration/products?inStockOnly=true \
  -H "x-api-key: your-api-key"
```

## Deployment Checklist

- [ ] Set up environment variables in both apps
- [ ] Configure Firebase security rules
- [ ] Test API endpoints
- [ ] Set up webhook endpoints (if using)
- [ ] Configure CORS if needed
- [ ] Set up monitoring/logging
- [ ] Test end-to-end flows
- [ ] Document API endpoints for team

## Support

For issues or questions:
1. Check Firebase Console for data
2. Review API logs in both applications
3. Verify environment variables are set correctly
4. Check network connectivity between apps

