/**
 * Integration Service
 * Handles bidirectional sync between CRM and E-commerce site
 */

import { orderService } from './order-service'
import { productService } from './product-service'
import { leadService } from './lead-service'
import { Order, Product, Lead } from '@/lib/models/types'

export interface EcommerceConfig {
  apiKey: string
  baseUrl: string
  webhookSecret?: string
}

export const integrationService = {
  /**
   * Sync order from CRM to E-commerce
   */
  async syncOrderToEcommerce(orderId: string, config: EcommerceConfig): Promise<void> {
    try {
      const orders = await orderService.getAllOrders()
      const order = orders.find(o => o.id === orderId)
      
      if (!order) {
        throw new Error('Order not found')
      }

      const response = await fetch(`${config.baseUrl}/api/orders/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
        },
        body: JSON.stringify({
          orderId: order.id,
          userId: order.userId,
          products: order.products,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to sync order: ${response.statusText}`)
      }
    } catch (error: any) {
      throw new Error(`Failed to sync order to e-commerce: ${error.message}`)
    }
  },

  /**
   * Sync product inventory from CRM to E-commerce
   */
  async syncProductToEcommerce(productId: string, config: EcommerceConfig): Promise<void> {
    try {
      const products = await productService.getAllProducts()
      const product = products.find(p => p.id === productId)
      
      if (!product) {
        throw new Error('Product not found')
      }

      const response = await fetch(`${config.baseUrl}/api/products/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
        },
        body: JSON.stringify({
          productId: product.id,
          stockQuantity: product.stockQuantity,
          stockStatus: product.stockStatus,
          price: product.price,
          discount: product.discount,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to sync product: ${response.statusText}`)
      }
    } catch (error: any) {
      throw new Error(`Failed to sync product to e-commerce: ${error.message}`)
    }
  },

  /**
   * Get real-time product updates (for e-commerce to listen)
   */
  async subscribeToProductUpdates(
    callback: (product: Product) => void,
    config: EcommerceConfig
  ): Promise<() => void> {
    // This would use Firebase real-time listeners
    // Implementation depends on your Firebase setup
    const unsubscribe = () => {
      // Cleanup logic
    }
    return unsubscribe
  },

  /**
   * Send webhook to e-commerce
   */
  async sendWebhook(
    event: string,
    data: any,
    config: EcommerceConfig
  ): Promise<void> {
    try {
      const response = await fetch(`${config.baseUrl}/api/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': config.webhookSecret || '',
        },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`)
      }
    } catch (error: any) {
      throw new Error(`Failed to send webhook: ${error.message}`)
    }
  },
}

