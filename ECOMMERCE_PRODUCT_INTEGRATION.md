# E-commerce Product Integration Guide

This guide shows how to display products from your CRM in your e-commerce site with real-time updates.

## Quick Setup

Since both apps use the same Firebase database, products added in CRM automatically appear in e-commerce!

## Method 1: Real-Time Product Listener (Recommended)

This automatically updates your e-commerce site when products are added/updated in CRM.

### Step 1: Install Firebase in E-commerce

```bash
npm install firebase
```

### Step 2: Create Firebase Config (Same as CRM)

```typescript
// lib/firebase.ts (in your e-commerce project)
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const db = getFirestore(initializeApp(firebaseConfig))
```

### Step 3: Create Product Hook with Real-Time Updates

```typescript
// hooks/useProducts.ts (in your e-commerce project)
'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Product {
  id: string
  name: string
  description: string
  price: number
  discount: number
  finalPrice: number
  category: string
  stockQuantity: number
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock'
  images: string[]
  primaryImage?: string
  brandName?: string
  // ... other fields
}

export function useProducts(options?: {
  category?: string
  inStockOnly?: boolean
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    
    // Build query
    let q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    
    if (options?.category) {
      q = query(q, where('category', '==', options.category))
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          // Calculate final price
          finalPrice: doc.data().price - (doc.data().price * doc.data().discount) / 100,
        })) as Product[]

        // Filter out-of-stock if requested
        if (options?.inStockOnly) {
          productList = productList.filter(
            (p) => p.stockQuantity > 0 && p.stockStatus !== 'out-of-stock'
          )
        }

        setProducts(productList)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [options?.category, options?.inStockOnly])

  return { products, loading, error }
}
```

### Step 4: Use in Your Product Page

```typescript
// app/products/page.tsx (in your e-commerce project)
'use client'

import { useProducts } from '@/hooks/useProducts'
import { useState } from 'react'

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const { products, loading, error } = useProducts({
    category: selectedCategory,
    inStockOnly: true, // Only show in-stock products
  })

  if (loading) return <div>Loading products...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id} className="border rounded-lg p-4">
          <img 
            src={product.primaryImage || product.images[0] || '/placeholder.jpg'} 
            alt={product.name}
            className="w-full h-48 object-cover rounded"
          />
          <h3 className="font-bold mt-2">{product.name}</h3>
          <p className="text-sm text-gray-600">{product.description}</p>
          <div className="mt-2">
            {product.discount > 0 && (
              <span className="text-gray-400 line-through mr-2">
                ${product.price}
              </span>
            )}
            <span className="text-lg font-bold text-green-600">
              ${product.finalPrice}
            </span>
          </div>
          <div className="mt-2">
            <span className={`text-sm ${
              product.stockStatus === 'in-stock' ? 'text-green-600' :
              product.stockStatus === 'low-stock' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {product.stockStatus === 'in-stock' ? 'In Stock' :
               product.stockStatus === 'low-stock' ? 'Low Stock' :
               'Out of Stock'}
            </span>
          </div>
          <button 
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
            disabled={product.stockStatus === 'out-of-stock'}
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  )
}
```

## Method 2: API-Based (Alternative)

If you prefer using the CRM API instead of direct Firestore access:

```typescript
// lib/crm-products.ts (in your e-commerce project)
const CRM_BASE_URL = process.env.NEXT_PUBLIC_CRM_BASE_URL || 'http://localhost:3000'
const CRM_API_KEY = process.env.NEXT_PUBLIC_CRM_API_KEY || ''

export async function getProductsFromCRM(category?: string) {
  const url = category 
    ? `${CRM_BASE_URL}/api/integration/products?category=${category}&inStockOnly=true`
    : `${CRM_BASE_URL}/api/integration/products?inStockOnly=true`
  
  const response = await fetch(url, {
    headers: {
      'x-api-key': CRM_API_KEY,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }
  
  const data = await response.json()
  return data.products
}
```

## Automatic Updates

When you add a product in CRM:
1. ✅ Product is saved to Firestore `products` collection
2. ✅ E-commerce real-time listener detects the new product
3. ✅ Product appears on e-commerce site automatically (no refresh needed!)

## Product Fields Available

Products from CRM include:
- `id` - Product ID
- `name` - Product name
- `description` - Product description
- `price` - Original price
- `discount` - Discount percentage
- `finalPrice` - Price after discount (calculate: `price - (price * discount / 100)`)
- `category` - Product category
- `subcategory` - Product subcategory
- `stockQuantity` - Available quantity
- `stockStatus` - 'in-stock' | 'low-stock' | 'out-of-stock'
- `images` - Array of image URLs
- `primaryImage` - Main product image
- `brandName` - Brand name
- `estimatedDelivery` - Delivery estimate
- `freeShippingThreshold` - Free shipping threshold

## Filtering Products

### By Category
```typescript
const { products } = useProducts({ category: 'medicines' })
```

### In-Stock Only
```typescript
const { products } = useProducts({ inStockOnly: true })
```

### Both
```typescript
const { products } = useProducts({ 
  category: 'medicines',
  inStockOnly: true 
})
```

## Stock Status Updates

When stock changes in CRM:
- ✅ Stock quantity updated
- ✅ Stock status auto-updated (in-stock/low-stock/out-of-stock)
- ✅ E-commerce site updates automatically via real-time listener
- ✅ "Add to Cart" button disabled for out-of-stock items

## Testing

1. **Add a product in CRM:**
   - Go to CRM → Products → Add Product
   - Fill in product details
   - Save

2. **Check e-commerce site:**
   - Product should appear immediately (if using real-time listener)
   - Or refresh page (if using API method)

3. **Update product in CRM:**
   - Change price, stock, or any field
   - E-commerce site updates automatically

## Troubleshooting

**Products not showing?**
- ✅ Check Firebase config matches CRM
- ✅ Verify Firestore rules allow public read for products
- ✅ Check browser console for errors
- ✅ Verify product has `stockStatus` set

**Real-time updates not working?**
- ✅ Check Firebase connection
- ✅ Verify `onSnapshot` listener is set up correctly
- ✅ Check browser console for Firestore errors

**Stock status incorrect?**
- ✅ Ensure `stockQuantity` is set when creating product
- ✅ Stock status auto-updates based on quantity (0 = out-of-stock, <10 = low-stock)


