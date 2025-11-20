import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { User } from '@/lib/models/types'

export const userService = {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'))
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as User))
    } catch (error: any) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }
  },

  // Block/Unblock user
  async toggleBlockUser(userId: string, isBlocked: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBlocked,
        updatedAt: Timestamp.now(),
      })
    } catch (error: any) {
      throw new Error(`Failed to update user block status: ${error.message}`)
    }
  },

  // Get user orders
  async getUserOrders(userId: string) {
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }))
    } catch (error: any) {
      throw new Error(`Failed to fetch user orders: ${error.message}`)
    }
  },

  // Identify high-value customers
  async getHighValueCustomers(): Promise<any[]> {
    try {
      const q = query(collection(db, 'users'), where('customerValue', '==', 'high-value'))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }))
    } catch (error: any) {
      throw new Error(`Failed to fetch high-value customers: ${error.message}`)
    }
  },
}
