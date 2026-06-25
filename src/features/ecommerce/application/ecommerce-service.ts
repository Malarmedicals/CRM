// Ecommerce Application Service
import { logger } from '@/core/logger/logger'
import { orderRepository } from '@/features/orders/infrastructure/order-repository'
import type { OrderItem } from '@/features/orders/domain/types'

export const ecommerceService = {
  async placeOrder(
    userId: string,
    customerName: string,
    customerPhone: string,
    items: OrderItem[],
    paymentMethod: string = 'COD'
  ): Promise<string> {
    try {
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      const orderData = {
        user_id: userId,
        customer_name: customerName,
        customer_phone: customerPhone,
        products: items,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: paymentMethod,
        delivery_status: 'pending',
        prescription_verified: false,
        is_new: true,
      }

      const id = await orderRepository.insert(orderData)
      logger.info('Order placed via ecommerce', { orderId: id, userId })
      return id
    } catch (error: any) {
      logger.error('Failed to place order via ecommerce', error, { userId })
      throw new Error(`Failed to place order: ${error.message}`)
    }
  },
}
