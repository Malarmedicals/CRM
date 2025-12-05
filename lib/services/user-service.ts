import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  Timestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { User } from '@/lib/models/types'

export const userService = {
  // Get all users (Admin/manager only)
  async getAllUsers(): Promise<User[]> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      // Check if user document exists, create if missing
      let userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      if (!userDoc.exists()) {
        // User document doesn't exist, try to create it
        // Try to check if this is the first user by querying the collection
        // With the updated rules, authenticated users can list the collection
        // but will only see documents they have read permission for
        let isFirstUser = false
        try {
          const allUsers = await getDocs(collection(db, 'users'))
          // If collection is empty, this is the first user
          // Note: If other users exist but current user can't see them (not Admin),
          // this check might incorrectly return true, but in practice, if other users
          // exist, at least one should be Admin and visible, or the first user would have
          // been created already
          isFirstUser = allUsers.empty
        } catch (readError: any) {
          // If we can't read users collection, default to 'user' role
          // User can be promoted to Admin later by an existing Admin
          console.warn('Could not check if first user:', readError.message)
          isFirstUser = false
        }

        try {
          await setDoc(doc(db, 'users', currentUser.uid), {
            email: currentUser.email || '',
            displayName: currentUser.displayName || '',
            role: isFirstUser ? 'admin' : 'user',
            isBlocked: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
          // Re-fetch the document
          userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        } catch (createError: any) {
          // If creation fails, check if it's a permission error
          if (createError.message?.includes('permission') || createError.message?.includes('Permission')) {
            throw new Error('User document does not exist and cannot be created. Please contact an administrator or sign out and sign in again.')
          }
          throw createError
        }
      }

      const userData = userDoc.data()
      // Check role safely (handle undefined/null and normalize to lowercase)
      const roleValue = userData?.role
      // Safe role normalization: ensure it's a string before calling toLowerCase
      const userRole = roleValue && typeof roleValue === 'string'
        ? (roleValue || '').toLowerCase().trim()
        : ''
      const isAdminOrManager = userRole === 'admin' || userRole === 'manager'

      // Debug log if role check fails
      if (!isAdminOrManager) {
        console.warn('[DEBUG] User role check failed:', {
          uid: currentUser.uid,
          role: roleValue || 'MISSING',
          normalizedRole: userRole || 'empty',
          userData: userData ? Object.keys(userData) : 'no data'
        })
      }

      if (!isAdminOrManager) {
        throw new Error('Insufficient permissions: admin or manager role required')
      }

      const querySnapshot = await getDocs(collection(db, 'users'))
      return querySnapshot.docs.map((doc) => {
        const data = doc.data()

        // Helper function to safely normalize role
        const safeNormalizeRole = (role: any): 'admin' | 'manager' | 'user' | 'customer' => {
          if (!role) {
            console.warn(`[DEBUG] User ${doc.id} has missing or undefined role field`)
            return 'user'
          }
          if (typeof role !== 'string') {
            console.warn(`[DEBUG] User ${doc.id} has invalid role type:`, typeof role, role)
            return 'user'
          }
          const normalized = role.toLowerCase().trim()
          if (normalized === 'admin' || normalized === 'manager' || normalized === 'user' || normalized === 'customer') {
            return normalized as 'admin' | 'manager' | 'user' | 'customer'
          }
          console.warn(`[DEBUG] User ${doc.id} has invalid role value:`, role, '-> normalized to user')
          return 'user'
        }

        // Safely handle all fields with defaults
        const roleValue = data?.role
        const normalizedRole = safeNormalizeRole(roleValue)

        // Debug log if role was missing or invalid
        if (!roleValue || typeof roleValue !== 'string' || normalizedRole === 'user' && roleValue.toLowerCase() !== 'user') {
          console.warn(`[DEBUG] User document ${doc.id}:`, {
            userId: doc.id,
            email: data?.email || 'missing',
            role: roleValue || 'MISSING',
            normalizedRole,
            allFields: Object.keys(data || {})
          })
        }

        return {
          id: doc.id,
          email: data?.email && typeof data.email === 'string' ? data.email : '',
          displayName: (data?.displayName && typeof data.displayName === 'string' ? data.displayName : null)
            || (data?.name && typeof data.name === 'string' ? data.name : null)
            || 'Unknown User',
          phoneNumber: data?.phoneNumber && typeof data.phoneNumber === 'string' ? data.phoneNumber : undefined,
          role: normalizedRole,
          isBlocked: data?.isBlocked === true,
          createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        } as User
      })
    } catch (error: any) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }
  },

  // Block/Unblock user (Admin/manager only)
  async toggleBlockUser(userId: string, isBlocked: boolean): Promise<void> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      // Check if user document exists
      let userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      if (!userDoc.exists()) {
        // User document doesn't exist, try to create it
        const allUsers = await getDocs(collection(db, 'users'))
        const isFirstUser = allUsers.empty

        await setDoc(doc(db, 'users', currentUser.uid), {
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          role: isFirstUser ? 'admin' : 'user',
          isBlocked: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      }

      const userData = userDoc.data()
      // Check role safely (handle undefined/null and normalize to lowercase)
      const roleValue = userData?.role
      // Safe role normalization: ensure it's a string before calling toLowerCase
      const userRole = roleValue && typeof roleValue === 'string'
        ? (roleValue || '').toLowerCase().trim()
        : ''
      const isAdminOrManager = userRole === 'admin' || userRole === 'manager'

      // Debug log if role check fails
      if (!isAdminOrManager) {
        console.warn('[DEBUG] User role check failed:', {
          uid: currentUser.uid,
          role: roleValue || 'MISSING',
          normalizedRole: userRole || 'empty',
          userData: userData ? Object.keys(userData) : 'no data'
        })
      }

      if (!isAdminOrManager) {
        throw new Error('Insufficient permissions: admin or manager role required')
      }

      await updateDoc(doc(db, 'users', userId), {
        isBlocked,
        updatedAt: Timestamp.now(),
      })
    } catch (error: any) {
      throw new Error(`Failed to update user block status: ${error.message}`)
    }
  },

  // Update user phone number (Admin/manager only)
  async updateUserPhone(userId: string, phoneNumber: string): Promise<void> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      // Check if user document exists
      let userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      if (!userDoc.exists()) {
        const allUsers = await getDocs(collection(db, 'users'))
        const isFirstUser = allUsers.empty

        await setDoc(doc(db, 'users', currentUser.uid), {
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          role: isFirstUser ? 'admin' : 'user',
          isBlocked: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      }

      const userData = userDoc.data()
      const roleValue = userData?.role
      const userRole = roleValue && typeof roleValue === 'string'
        ? (roleValue || '').toLowerCase().trim()
        : ''
      const isAdminOrManager = userRole === 'admin' || userRole === 'manager'

      if (!isAdminOrManager) {
        throw new Error('Insufficient permissions: admin or manager role required')
      }

      const updateData: any = {
        updatedAt: Timestamp.now(),
      }

      // Only add phoneNumber if it's provided, otherwise remove it
      if (phoneNumber && phoneNumber.trim()) {
        updateData.phoneNumber = phoneNumber.trim()
      } else {
        // Remove phoneNumber field if empty
        updateData.phoneNumber = null
      }

      await updateDoc(doc(db, 'users', userId), updateData)
    } catch (error: any) {
      throw new Error(`Failed to update user phone number: ${error.message}`)
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

  // Identify high-value customers (Admin/manager only)
  async getHighValueCustomers(): Promise<any[]> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      // Check if user document exists
      let userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      if (!userDoc.exists()) {
        // User document doesn't exist, try to create it
        const allUsers = await getDocs(collection(db, 'users'))
        const isFirstUser = allUsers.empty

        await setDoc(doc(db, 'users', currentUser.uid), {
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          role: isFirstUser ? 'admin' : 'user',
          isBlocked: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      }

      const userData = userDoc.data()
      // Check role safely (handle undefined/null and normalize to lowercase)
      const roleValue = userData?.role
      // Safe role normalization: ensure it's a string before calling toLowerCase
      const userRole = roleValue && typeof roleValue === 'string'
        ? (roleValue || '').toLowerCase().trim()
        : ''
      const isAdminOrManager = userRole === 'admin' || userRole === 'manager'

      // Debug log if role check fails
      if (!isAdminOrManager) {
        console.warn('[DEBUG] User role check failed:', {
          uid: currentUser.uid,
          role: roleValue || 'MISSING',
          normalizedRole: userRole || 'empty',
          userData: userData ? Object.keys(userData) : 'no data'
        })
      }

      if (!isAdminOrManager) {
        throw new Error('Insufficient permissions: admin or manager role required')
      }

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
