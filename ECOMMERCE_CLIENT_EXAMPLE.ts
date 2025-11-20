/**
 * E-commerce Client Example
 * Copy this to your e-commerce project and customize as needed
 * 
 * This file shows how to integrate with the CRM from your e-commerce site
 */

// ============================================
// Configuration
// ============================================

const CRM_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_CRM_BASE_URL || 'http://localhost:3000',
  apiKey: process.env.NEXT_PUBLIC_CRM_API_KEY || '',
}

// ============================================
// Types (should match CRM types)
// ============================================

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

interface CreateOrderRequest {
  userId: string
  products: OrderItem[]
  totalAmount: number
  prescriptionVerified?: boolean
}

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
}

// ============================================
// CRM Client
// ============================================

export class CRMClient {
  private baseUrl: string
  private apiKey: string

  constructor(config: typeof CRM_CONFIG) {
    this.baseUrl = config.baseUrl
    this.apiKey = config.apiKey
  }

  /**
   * Create an order in CRM
   */
  async createOrder(orderData: CreateOrderRequest) {
    const response = await fetch(`${this.baseUrl}/api/integration/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create order')
    }

    return response.json()
  }

  /**
   * Get all products from CRM
   */
  async getProducts(options?: {
    category?: string
    inStockOnly?: boolean
  }): Promise<Product[]> {
    const params = new URLSearchParams()
    if (options?.category) params.append('category', options.category)
    if (options?.inStockOnly) params.append('inStockOnly', 'true')

    const url = `${this.baseUrl}/api/integration/products${params.toString() ? `?${params}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': this.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch products')
    }

    const data = await response.json()
    return data.products
  }

  /**
   * Update product stock in CRM
   */
  async updateProductStock(
    productId: string,
    quantity: number,
    operation: 'set' | 'increment' | 'decrement' = 'set'
  ) {
    const response = await fetch(`${this.baseUrl}/api/integration/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        productId,
        quantity,
        operation,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update product stock')
    }

    return response.json()
  }

  /**
   * Get orders (with optional filters)
   */
  async getOrders(options?: {
    userId?: string
    status?: string
  }) {
    const params = new URLSearchParams()
    if (options?.userId) params.append('userId', options.userId)
    if (options?.status) params.append('status', options.status)

    const url = `${this.baseUrl}/api/integration/orders${params.toString() ? `?${params}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': this.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch orders')
    }

    const data = await response.json()
    return data.orders
  }

  /**
   * Send webhook to CRM
   */
  async sendWebhook(event: string, data: any) {
    const response = await fetch(`${this.baseUrl}/api/integration/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': process.env.WEBHOOK_SECRET || '',
      },
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send webhook')
    }

    return response.json()
  }
}

// ============================================
// Usage Examples
// ============================================

// Initialize client
const crmClient = new CRMClient(CRM_CONFIG)

// Example 1: Create order on checkout
export async function handleCheckout(userId: string, cartItems: any[]) {
  try {
    const order = await crmClient.createOrder({
      userId,
      products: cartItems.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    })

    console.log('Order created in CRM:', order.orderId)
    return order
  } catch (error) {
    console.error('Failed to create order in CRM:', error)
    throw error
  }
}

// Example 2: Fetch products for catalog
export async function fetchProductsForCatalog(category?: string) {
  try {
    const products = await crmClient.getProducts({
      category,
      inStockOnly: true, // Only show in-stock products
    })
    return products
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return []
  }
}

// Example 3: Update stock after purchase
export async function updateStockAfterPurchase(productId: string, quantitySold: number) {
  try {
    await crmClient.updateProductStock(productId, quantitySold, 'decrement')
    console.log('Stock updated in CRM')
  } catch (error) {
    console.error('Failed to update stock:', error)
  }
}

// Example 4: Send lead from contact form
export async function submitContactForm(formData: {
  name: string
  email: string
  phone: string
  message: string
}) {
  try {
    await crmClient.sendWebhook('lead.created', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: formData.message,
    })
    console.log('Lead sent to CRM')
  } catch (error) {
    console.error('Failed to send lead:', error)
  }
}

// Example 5: React Hook for products
/*
import { useEffect, useState } from 'react'

export function useProductsFromCRM(category?: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const data = await crmClient.getProducts({ category, inStockOnly: true })
        setProducts(data)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category])

  return { products, loading, error }
}
*/

