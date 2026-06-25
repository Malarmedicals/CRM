// Orders domain types
import { z } from 'zod'

export interface OrderItem {
  productId: string
  name: string
  productName?: string
  category?: string
  quantity: number
  price: number
  image?: string | null
}

export interface Order {
  id: string
  userId: string
  customerName?: string
  customerPhone?: string
  products: OrderItem[]
  items?: OrderItem[]
  totalAmount: number
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled'
  isNew?: boolean
  paymentMethod?: string
  deliveryStatus?: 'pending' | 'packing' | 'shipped' | 'delivered'
  prescriptionVerified: boolean
  dispatchTracking?: string
  createdAt: Date
  updatedAt: Date
}

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'shipped', 'delivered', 'cancelled']),
})
