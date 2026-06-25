// Orders Application Layer
import { logger } from '@/core/logger/logger'
import { orderRepository } from '../infrastructure/order-repository'
import type { Order } from '../domain/types'

export const orderService = {
  async getOrders(): Promise<Order[]> {
    try {
      return await orderRepository.getAll()
    } catch (error: any) {
      logger.error('Failed to fetch orders', error)
      throw new Error(`Failed to fetch orders: ${error.message}`)
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    try {
      return await orderRepository.getById(id)
    } catch (error: any) {
      logger.error('Failed to fetch order', error, { orderId: id })
      throw new Error(`Failed to fetch order: ${error.message}`)
    }
  },

  async addOrder(orderData: any): Promise<string> {
    try {
      const id = await orderRepository.insert(orderData)
      logger.info('Order created', { orderId: id })
      return id
    } catch (error: any) {
      logger.error('Failed to create order', error)
      throw new Error(`Failed to create order: ${error.message}`)
    }
  },

  async updateOrderStatus(id: string, status: string): Promise<void> {
    try {
      await orderRepository.updateStatus(id, status)
      logger.info('Order status updated', { orderId: id, status })
    } catch (error: any) {
      logger.error('Failed to update order status', error, { orderId: id })
      throw new Error(`Failed to update order status: ${error.message}`)
    }
  },

  async updateOrder(id: string, updates: any): Promise<void> {
    try {
      await orderRepository.update(id, updates)
      logger.info('Order updated', { orderId: id })
    } catch (error: any) {
      logger.error('Failed to update order', error, { orderId: id })
      throw new Error(`Failed to update order: ${error.message}`)
    }
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      await orderRepository.delete(id)
      logger.info('Order deleted', { orderId: id })
    } catch (error: any) {
      logger.error('Failed to delete order', error, { orderId: id })
      throw new Error(`Failed to delete order: ${error.message}`)
    }
  },
}
