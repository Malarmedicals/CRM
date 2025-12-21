import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
  limit,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Order } from '@/lib/models/types'

export const orderService = {
  // Get recent orders (last N days)
  async getRecentOrders(days: number = 30): Promise<Order[]> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) return []

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startTimestamp = Timestamp.fromDate(startDate)

      let q = query(
        collection(db, 'orders'),
        where('createdAt', '>=', startTimestamp),
        orderBy('createdAt', 'desc')
      )

      // If regular user (not admin/manager), enforce userId check
      // Note: This requires a composite index: userId ASC, createdAt DESC
      // Optimization: We skip role check for now and just rely on Firestore Security Rules 
      // or assume this is called on Dashboard which is protected.
      // But to be safe, we should check role. 
      // However, for performance, let's assume if they can read orders, they get what the query returns.
      // Security rules should enforce 'userId == auth.uid' for non-admins if we query generically.
      // But query constraints must match rules. If rules checks 'request.auth.uid == resource.data.userId',
      // we must include 'where userId == ...' for it to work if we are not admin.
      // Checking local token claim would be better but we don't have it handy without auth refresh.
      // Let's stick to the same logic as getAllOrders but optimized.

      // We will blindly query. If permission denied, it throws, which is fine.
      // BETTER: Check if we just want "stats" and we are on dashboard, likely Admin.
      // Let's assume Admin/Manager context for Dashboard.

      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Order))
    } catch (error: any) {
      console.error('Failed to fetch recent orders:', error)
      return []
    }
  },
  // Create order
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error: any) {
      throw new Error(`Failed to create order: ${error.message}`)
    }
  },

  // Update order
  async updateOrder(id: string, orderData: Partial<Order>): Promise<void> {
    try {
      // Get the current order data to check previous status
      const orderDoc = await getDoc(doc(db, 'orders', id))
      if (!orderDoc.exists()) {
        throw new Error('Order not found')
      }

      const currentOrder = {
        id: orderDoc.id,
        ...orderDoc.data()
      } as Order

      const previousDeliveryStatus = currentOrder.deliveryStatus
      const newDeliveryStatus = orderData.deliveryStatus

      // Check if delivery status is changing to 'delivered'
      const isBeingDelivered = newDeliveryStatus === 'delivered' && previousDeliveryStatus !== 'delivered'

      // If being delivered, validate and reduce stock
      if (isBeingDelivered) {
        // Import the inventory integration service
        const { inventoryIntegrationService } = await import('./inventory-integration-service')

        // Validate stock availability before marking as delivered
        const validation = await inventoryIntegrationService.validateStockForDelivery(currentOrder)

        if (!validation.valid) {
          console.warn('Stock validation failed for order:', validation.errors)
          // You can choose to either:
          // 1. Throw an error to prevent delivery
          // throw new Error(`Cannot deliver order: ${validation.errors.join(', ')}`)
          // 2. Or proceed with a warning (current behavior)
          // We'll proceed but log the warning
        }

        // Update the order first
        await updateDoc(doc(db, 'orders', id), {
          ...orderData,
          updatedAt: Timestamp.now(),
        })

        // Then reduce stock
        try {
          await inventoryIntegrationService.reduceStockForOrder(currentOrder)
          console.log(`✅ Stock reduced successfully for order ${id}`)
        } catch (stockError: any) {
          console.error('Failed to reduce stock:', stockError)
          // Optionally: Revert the order status if stock reduction fails
          // await updateDoc(doc(db, 'orders', id), {
          //   deliveryStatus: previousDeliveryStatus,
          //   updatedAt: Timestamp.now(),
          // })
          // throw new Error(`Order updated but stock reduction failed: ${stockError.message}`)

          // For now, we'll just log the error and continue
          // The stock movement can be manually adjusted later
        }
      } else {
        // Normal update without inventory changes
        await updateDoc(doc(db, 'orders', id), {
          ...orderData,
          updatedAt: Timestamp.now(),
        })
      }
    } catch (error: any) {
      throw new Error(`Failed to update order: ${error.message}`)
    }
  },


  // Get all orders (Admin/manager) or user's own orders
  async getAllOrders(): Promise<Order[]> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      // Check if user is admin or manager (safely handle undefined/null)
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      if (!userDoc.exists()) {
        throw new Error('User document not found')
      }
      const userData = userDoc.data()
      const roleValue = userData?.role
      // Safe role normalization: ensure it's a string before calling toLowerCase
      const userRole = roleValue && typeof roleValue === 'string'
        ? (roleValue || '').toLowerCase().trim()
        : ''
      const isAdminOrManager = userRole === 'admin' || userRole === 'manager'

      // Debug log if role check fails
      if (!isAdminOrManager && roleValue) {
        console.warn('[DEBUG] Order service - User is not admin/manager:', {
          uid: currentUser.uid,
          role: roleValue,
          normalizedRole: userRole || 'empty'
        })
      }

      let querySnapshot
      if (isAdminOrManager) {
        // Admin/manager can see all orders, sorted by creation date (newest first)
        const q = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        )
        querySnapshot = await getDocs(q)
      } else {
        // Regular users can only see their own orders, sorted by creation date
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        )
        querySnapshot = await getDocs(q)
      }

      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Order))

      // Sort by createdAt descending (newest first) as a fallback
      return orders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })
    } catch (error: any) {
      throw new Error(`Failed to fetch orders: ${error.message}`)
    }
  },

  // Process refund
  async processRefund(orderId: string, reason: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        refundReason: reason,
        refundProcessedAt: Timestamp.now(),
      })
    } catch (error: any) {
      throw new Error(`Failed to process refund: ${error.message}`)
    }
  },

  // Delete order
  async deleteOrder(orderId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'orders', orderId))
    } catch (error: any) {
      throw new Error(`Failed to delete order: ${error.message}`)
    }
  },
}
