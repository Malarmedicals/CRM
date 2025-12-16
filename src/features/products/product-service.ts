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
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Product } from '@/lib/models/types'

export const productService = {
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

      await setDoc(docRef, {
        ...productData,
        stockStatus, // Ensure stockStatus is set
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
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
          expiryDate: data.expiryDate?.toDate() || new Date(),
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
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
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
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
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
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Product))
    } catch (error: any) {
      throw new Error(`Failed to fetch low stock products: ${error.message}`)
    }
  },

  // Get expiring products
  async getExpiringProducts(): Promise<Product[]> {
    try {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const allProducts = await this.getAllProducts()
      return allProducts.filter((product) => {
        const expiryDate = new Date(product.expiryDate)
        return expiryDate <= thirtyDaysFromNow && expiryDate > new Date()
      })
    } catch (error: any) {
      throw new Error(`Failed to fetch expiring products: ${error.message}`)
    }
  },
}
