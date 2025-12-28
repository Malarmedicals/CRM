import {
  collection,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  limit,
  Timestamp,
  getCountFromServer,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Product } from '@/lib/models/types'

export const productService = {
  // Safe date converter
  safeDate(date: any): Date {
    if (!date) return new Date()
    if (date?.toDate && typeof date.toDate === 'function') return date.toDate()
    if (date instanceof Date) return date
    if (typeof date === 'string' || typeof date === 'number') return new Date(date)
    // Handle serialized timestamp { seconds: ..., nanoseconds: ... }
    if (date?.seconds) return new Date(date.seconds * 1000)
    return new Date()
  },

  // Search products by name (prefix search)
  async searchProducts(searchTerm: string): Promise<Product[]> {
    try {
      if (!searchTerm) return []

      // Standardize search term
      const term = searchTerm.toLowerCase()
      // Note: This requires a field 'searchName' or equivalent lowercased name in DB for case-insensitive search
      // efficiently. For now, assuming 'name' matches or we do client side filtering if result set is small?
      // Actually, Firestore is case-sensitive.
      // Better approach without external search engine:
      // use 'orderBy(name)' and startAt/endAt.
      // But 'name' is usually Capitalized in DB.

      // Fix: We'll assume the user types matching case or we handle it. 
      // Ideally, we maintain a `nameLower` field in DB. 
      // For now, let's try a range query on 'name', assuming sentence case.
      // Or we can rely on 'getAllProducts' if we really have to, but that's what we want to avoid.

      // Alternative: Just fetch recent or popular products? 
      // No, for medicine selector we need specific ones.

      // Let's implement basic prefix search on 'name'.
      const q = query(
        collection(db, 'products'),
        orderBy('name'),
        startAt(searchTerm),
        endAt(searchTerm + '\uf8ff'),
        limit(20)
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.safeDate(doc.data().createdAt),
        updatedAt: this.safeDate(doc.data().updatedAt),
      } as Product))
    } catch (error: any) {
      console.error('Failed to search products:', error)
      return []
    }
  },
  // Add new product
  async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Auto-set stockStatus based on stockQuantity
      const stockQuantity = productData.stockQuantity || 0
      let stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock'
      if (stockQuantity === 0) {
        stockStatus = 'out-of-stock'
      } else if (stockQuantity < 10) {
        stockStatus = 'low-stock'
      }

      // Generate SEO-friendly slug from name
      let slug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

      // Fallback if slug is empty
      if (!slug) {
        slug = 'product-' + Date.now()
      }

      // Check if product with this slug already exists to prevent accidental overwrite
      // We'll append a random string if it exists to ensure uniqueness while keeping the name part
      // Note: This needs 'getDoc' to be imported
      let docRef = doc(db, 'products', slug)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`
        docRef = doc(db, 'products', slug)
      }

      // Helper to remove undefined values recursively
      const removeUndefined = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj
        if (obj instanceof Date) return obj
        if (obj instanceof Timestamp) return obj
        if (Array.isArray(obj)) return obj.map(removeUndefined)

        return Object.entries(obj).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = removeUndefined(value)
          }
          return acc
        }, {} as any)
      }

      // Sanitize data
      const sanitizedData = removeUndefined({
        ...productData,
        stockStatus,
        stockQuantity: productData.stockQuantity ?? 0,
        price: productData.price ?? 0,
        discount: productData.discount ?? 0,
        mrp: productData.mrp ?? 0,
        sellingPrice: productData.sellingPrice ?? 0,
        gstRate: productData.gstRate ?? 18,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      await setDoc(docRef, sanitizedData)
      return slug
    } catch (error: any) {
      throw new Error(`Failed to add product: ${error.message}`)
    }
  },

  // Update product
  async updateProduct(id: string, productData: Partial<Product>): Promise<void> {
    try {
      // Auto-update stockStatus if stockQuantity is being updated
      const updateData: any = { ...productData, updatedAt: Timestamp.now() }
      if (productData.stockQuantity !== undefined) {
        const stockQuantity = productData.stockQuantity
        if (stockQuantity === 0) {
          updateData.stockStatus = 'out-of-stock'
        } else if (stockQuantity < 10) {
          updateData.stockStatus = 'low-stock'
        } else {
          updateData.stockStatus = 'in-stock'
        }
      }

      await updateDoc(doc(db, 'products', id), updateData)
    } catch (error: any) {
      throw new Error(`Failed to update product: ${error.message}`)
    }
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'products', id))
    } catch (error: any) {
      throw new Error(`Failed to delete product: ${error.message}`)
    }
  },

  // Get all products
  async getAllProducts(): Promise<Product[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'))
      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          discount: data.discount || 0,
          category: data.category || '',
          subcategory: data.subcategory || '',
          batchNumber: data.batchNumber || '',
          expiryDate: this.safeDate(data.expiryDate),
          stockQuantity: data.stockQuantity || 0,
          images: data.images || [],
          primaryImage: data.primaryImage,
          additionalImages: data.additionalImages,
          productDetails: data.productDetails || [],
          colorVariants: data.colorVariants || [],
          materials: data.materials || [],
          seoTags: data.seoTags,
          hsnCode: data.hsnCode,
          gstRate: data.gstRate,
          vendor: data.vendor,
          brandName: data.brandName,
          stockStatus: data.stockStatus || 'in-stock',
          estimatedDelivery: data.estimatedDelivery,
          freeShippingThreshold: data.freeShippingThreshold,
          compliance: data.compliance,
          shipping: data.shipping,
          seo: data.seo,
          medicalInfo: data.medicalInfo,
          createdAt: this.safeDate(data.createdAt),
          updatedAt: this.safeDate(data.updatedAt),
        } as Product
      })
    } catch (error: any) {
      throw new Error(`Failed to fetch products: ${error.message}`)
    }
  },

  // Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const q = query(collection(db, 'products'), where('category', '==', category))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.safeDate(doc.data().createdAt),
        updatedAt: this.safeDate(doc.data().updatedAt),
      } as Product))
    } catch (error: any) {
      throw new Error(`Failed to fetch products by category: ${error.message}`)
    }
  },

  // Get low stock products
  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    try {
      const q = query(collection(db, 'products'), where('stockQuantity', '<', threshold))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.safeDate(doc.data().createdAt),
        updatedAt: this.safeDate(doc.data().updatedAt),
      } as Product))
    } catch (error: any) {
      throw new Error(`Failed to fetch low stock products: ${error.message}`)
    }
  },

  // Get product count
  async getProductCount(): Promise<number> {
    try {
      const snapshot = await getCountFromServer(collection(db, 'products'))
      return snapshot.data().count
    } catch (error: any) {
      console.error('Failed to get product count:', error)
      return 0
    }
  },

  // Get expiring products
  async getExpiringProducts(): Promise<Product[]> {
    try {
      const today = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const q = query(
        collection(db, 'products'),
        where('expiryDate', '<=', thirtyDaysFromNow),
        where('expiryDate', '>', today)
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          discount: data.discount || 0,
          category: data.category || '',
          subcategory: data.subcategory || '',
          expiryDate: this.safeDate(data.expiryDate),
          stockQuantity: data.stockQuantity || 0,
          images: data.images || [],
          primaryImage: data.primaryImage,
          additionalImages: data.additionalImages,
          productDetails: data.productDetails || [],
          colorVariants: data.colorVariants || [],
          materials: data.materials || [],
          seoTags: data.seoTags,
          hsnCode: data.hsnCode,
          gstRate: data.gstRate,
          vendor: data.vendor,
          brandName: data.brandName,
          stockStatus: data.stockStatus || 'in-stock',
          estimatedDelivery: data.estimatedDelivery,
          freeShippingThreshold: data.freeShippingThreshold,
          createdAt: this.safeDate(data.createdAt),
          updatedAt: this.safeDate(data.updatedAt),
        } as Product
      })
    } catch (error: any) {
      console.error('Failed to fetch expiring products:', error)
      return []
    }
  },
}
