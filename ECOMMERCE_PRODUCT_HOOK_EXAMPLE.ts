/**
 * Complete Product Hook Example for E-commerce
 * Copy this to your e-commerce project: hooks/useProducts.ts
 */

'use client'

import { useState, useEffect } from 'react'
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore'
import { db } from '@/lib/firebase' // Your Firebase config

export interface EcommerceProduct {
  id: string
  name: string
  description: string
  price: number
  discount: number
  finalPrice: number
  category: string
  subcategory: string
  stockQuantity: number
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock'
  images: string[]
  primaryImage?: string
  additionalImages?: string[]
  brandName?: string
  estimatedDelivery?: string
  freeShippingThreshold?: number
  createdAt?: Date
  updatedAt?: Date
}

interface UseProductsOptions {
  category?: string
  subcategory?: string
  inStockOnly?: boolean
  limitCount?: number
  sortBy?: 'price' | 'name' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<EcommerceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    try {
      // Build base query
      let q = query(collection(db, 'products'))

      // Apply filters
      if (options.category) {
        q = query(q, where('category', '==', options.category))
      }

      if (options.subcategory) {
        q = query(q, where('subcategory', '==', options.subcategory))
      }

      // Apply sorting
      const sortField = options.sortBy || 'createdAt'
      const sortDirection = options.sortOrder === 'asc' ? 'asc' : 'desc'
      q = query(q, orderBy(sortField, sortDirection))

      // Apply limit
      if (options.limitCount) {
        q = query(q, limit(options.limitCount))
      }

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let productList = snapshot.docs.map((doc) => {
            const data = doc.data()
            const price = data.price || 0
            const discount = data.discount || 0
            const finalPrice = price - (price * discount) / 100

            return {
              id: doc.id,
              ...data,
              finalPrice,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
            } as EcommerceProduct
          })

          // Filter out-of-stock if requested
          if (options.inStockOnly) {
            productList = productList.filter(
              (p) => p.stockQuantity > 0 && p.stockStatus !== 'out-of-stock'
            )
          }

          setProducts(productList)
          setLoading(false)
        },
        (err) => {
          console.error('Error fetching products:', err)
          setError(err.message)
          setLoading(false)
        }
      )

      // Cleanup listener on unmount
      return () => unsubscribe()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [
    options.category,
    options.subcategory,
    options.inStockOnly,
    options.limitCount,
    options.sortBy,
    options.sortOrder,
  ])

  return { products, loading, error }
}

/**
 * Hook to get a single product by ID
 */
export function useProduct(productId: string) {
  const [product, setProduct] = useState<EcommerceProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const q = query(
        collection(db, 'products'),
        where('__name__', '==', productId)
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            setError('Product not found')
            setProduct(null)
          } else {
            const doc = snapshot.docs[0]
            const data = doc.data()
            const price = data.price || 0
            const discount = data.discount || 0
            const finalPrice = price - (price * discount) / 100

            setProduct({
              id: doc.id,
              ...data,
              finalPrice,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
            } as EcommerceProduct)
          }
          setLoading(false)
        },
        (err) => {
          console.error('Error fetching product:', err)
          setError(err.message)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [productId])

  return { product, loading, error }
}

/**
 * Hook to get products by category
 */
export function useProductsByCategory(category: string, inStockOnly = true) {
  return useProducts({ category, inStockOnly })
}

/**
 * Hook to get featured products (newest)
 */
export function useFeaturedProducts(limitCount = 8) {
  return useProducts({
    inStockOnly: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limitCount,
  })
}


