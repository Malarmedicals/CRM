# Real-Time Product Sync - CRM to E-commerce

## ✅ What's Implemented

Your E-commerce site now has **real-time product synchronization** with your CRM! When you add, update, or delete products in your CRM, they will automatically appear (or disappear) in the E-commerce site **without needing to refresh the page**.

## How It Works

1. **Real-Time Listener**: The E-commerce site uses Firestore's `onSnapshot` listener
2. **Automatic Updates**: When products change in Firestore, the listener automatically updates the UI
3. **Shared Database**: Both CRM and E-commerce use the same Firestore `products` collection

## What Happens When You Add a Product in CRM

1. ✅ Product is added to Firestore `products` collection
2. ✅ `stockStatus` is automatically set based on `stockQuantity`:
   - `stockQuantity = 0` → `stockStatus = 'out-of-stock'`
   - `stockQuantity < 10` → `stockStatus = 'low-stock'`
   - `stockQuantity >= 10` → `stockStatus = 'in-stock'`
3. ✅ E-commerce listener detects the change
4. ✅ Product automatically appears on the e-commerce site
5. ✅ No page refresh needed!

## Product Requirements in Firestore

When adding products in your CRM, make sure they have these fields:

```typescript
{
  name: string,                    // Required: Product name
  price: number,                   // Required: Product price
  discount: number,                // Optional: Discount percentage (0-100)
  stockQuantity: number,           // Required: Stock quantity (must be > 0 to show)
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock', // Auto-set based on stockQuantity
  category: string,                // Optional: Product category
  subcategory: string,            // Optional: Product subcategory
  description: string,            // Optional: Product description
  images: string[],               // Array of image URLs
  primaryImage?: string,           // Optional: Main product image URL
  additionalImages?: string[],    // Optional: Additional image URLs
  brandName?: string,              // Optional: Brand name
  estimatedDelivery?: string,      // Optional: Delivery estimate
  freeShippingThreshold?: number,  // Optional: Free shipping threshold
  // ... other optional fields
}
```

### Important Fields:
- **`name`**: Required - Product name
- **`price`**: Required - Product price
- **`stockQuantity`**: Required - Must be > 0 for product to appear (only in-stock products show)
- **`stockStatus`**: Auto-set by CRM - Don't manually set this

### Field Mapping:
- ✅ `stockQuantity` (not `stock`) - Stock quantity
- ✅ `price` (not `sellingPrice`) - Product price
- ✅ `brandName` (not `brand`) - Brand name
- ✅ `stockStatus` - Auto-calculated from `stockQuantity`

## Testing Real-Time Sync

### Step 1: Open E-commerce
1. Start your E-commerce frontend: `npm run dev` (or `pnpm dev`)
2. Open `http://localhost:3001` in browser
3. Open browser console (F12) to see logs

### Step 2: Add Product in CRM
1. In your CRM, go to **Dashboard → Products → Add Product**
2. Fill in required fields:
   - Name: "Test Product"
   - Price: 100
   - Stock Quantity: 50 (must be > 0)
   - Category: "Medicines"
   - Add at least one image
3. Click **Save**

### Step 3: Watch E-commerce
1. **Product should appear automatically** on the e-commerce homepage
2. No refresh needed!
3. Console will show real-time updates

### Step 4: Test Updates
1. **Update product price** in CRM → Changes appear immediately in E-commerce
2. **Update product name** in CRM → Changes appear immediately
3. **Update `stockQuantity` to 0** in CRM → Product disappears from E-commerce
4. **Update `stockQuantity` back to > 0** → Product reappears
5. **Delete product** in CRM → Product disappears from E-commerce

## Features

✅ **Real-time additions** - New products appear instantly  
✅ **Real-time updates** - Price/name/stock changes update immediately  
✅ **Real-time deletions** - Removed products disappear automatically  
✅ **Stock filtering** - Only products with `stockQuantity > 0` and `stockStatus !== 'out-of-stock'` are shown  
✅ **Automatic stock status** - `stockStatus` auto-updates when `stockQuantity` changes  
✅ **Price calculation** - `finalPrice = price - (price * discount / 100)` calculated automatically  

## Implementation Example

### In Your E-commerce Project:

```typescript
// hooks/useProducts.ts
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useProducts(options?: {
  category?: string
  inStockOnly?: boolean
}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    
    if (options?.category) {
      q = query(q, where('category', '==', options.category))
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let productList = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          // Calculate final price
          finalPrice: data.price - (data.price * (data.discount || 0)) / 100,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        }
      })

      // Filter out-of-stock if requested
      if (options?.inStockOnly) {
        productList = productList.filter(
          (p) => p.stockQuantity > 0 && p.stockStatus !== 'out-of-stock'
        )
      }

      setProducts(productList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [options?.category, options?.inStockOnly])

  return { products, loading }
}
```

### Use in Component:

```typescript
// app/products/page.tsx
import { useProducts } from '@/hooks/useProducts'

export default function ProductsPage() {
  const { products, loading } = useProducts({ inStockOnly: true })

  if (loading) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.id}>
          <img src={product.primaryImage || product.images[0]} alt={product.name} />
          <h3>{product.name}</h3>
          <p>${product.finalPrice}</p>
          <span className={product.stockStatus === 'in-stock' ? 'text-green-600' : 'text-yellow-600'}>
            {product.stockStatus}
          </span>
        </div>
      ))}
    </div>
  )
}
```

## Firestore Index (Optional)

If you see an index error in console when filtering by category, create a composite index:

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Collection: `products`
4. Fields:
   - `category` (Ascending)
   - `createdAt` (Descending)
5. Click "Create"

**Note:** The app will work without this index, but category filtering might be slower.

## Troubleshooting

### Products don't appear:
- [ ] Check product has `stockQuantity > 0`
- [ ] Verify product has `stockStatus !== 'out-of-stock'`
- [ ] Verify product is in `products` collection in Firestore
- [ ] Check browser console for errors
- [ ] Verify Firestore rules allow public read access for products
- [ ] Check field names match exactly (`stockQuantity`, not `stock`)

### Products appear but don't update:
- [ ] Check if real-time listener is active (see console logs)
- [ ] Verify you're updating the same Firestore project
- [ ] Check browser console for errors
- [ ] Verify `onSnapshot` is being used (not `getDocs`)

### Wrong field names:
- [ ] Use `stockQuantity` (not `stock`)
- [ ] Use `price` (not `sellingPrice`)
- [ ] Use `brandName` (not `brand`)
- [ ] `stockStatus` is auto-set - don't manually set it

### Index error:
- [ ] Create composite index (see above)
- [ ] Or remove `orderBy` from query temporarily
- [ ] Or use simpler query without category filter

## Console Messages

You'll see these messages in browser console:

- `✅ Products loaded successfully` - Products loaded
- `⚠️ No products found` - No products in Firestore
- `Index not found, using simpler query` - Index missing, using fallback
- `Error listening to products: [error]` - Connection error, check Firestore rules

## Stock Status Auto-Update

The CRM automatically sets `stockStatus` when you add/update products:

| stockQuantity | stockStatus |
|--------------|-------------|
| 0 | `out-of-stock` |
| 1-9 | `low-stock` |
| 10+ | `in-stock` |

This happens automatically in:
- `productService.addProduct()` - When creating new product
- `productService.updateProduct()` - When updating stock quantity

## Next Steps

Your E-commerce is now fully synchronized with your CRM! Products added in CRM will automatically appear in E-commerce in real-time.

**Remember:**
- Use `stockQuantity` (not `stock`)
- Use `price` (not `sellingPrice`)
- Use `brandName` (not `brand`)
- `stockStatus` is auto-calculated - don't set it manually

