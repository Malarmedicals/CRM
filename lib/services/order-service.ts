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
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Order } from '@/lib/models/types'

export const orderService = {
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
      await updateDoc(doc(db, 'orders', id), {
        ...orderData,
        updatedAt: Timestamp.now(),
      })
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
