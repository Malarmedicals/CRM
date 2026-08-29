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
  razorpayOrderId?: string | null;
  paymentId?: string | null;
  coupon_code?: string | null;
  coupon_discount?: number;
  prescriptionVerified: boolean
  dispatchTracking?: string
  // BlueDart shipment fields, synced from e-commerce via the shipment.updated webhook event
  awbNo?: string | null
  courierStatus?: string | null
  estimatedDelivery?: string | null
  lastScanLocation?: string | null
  lastScanTimestamp?: string | null
  codAmount?: number | null
  createdAt: Date
  updatedAt: Date
}

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'shipped', 'delivered', 'cancelled']),
})
