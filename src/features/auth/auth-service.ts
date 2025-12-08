import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { setDoc, doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { User } from '@/lib/models/types'

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, displayName: string): Promise<FirebaseUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update profile with display name
      await updateProfile(userCredential.user, { displayName })

      // Create user document in Firestore
      // Check if this is the first user (make them Admin)
      const allUsers = await getDocs(collection(db, 'users'))
      const isFirstUser = allUsers.empty

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName,
        role: isFirstUser ? 'admin' : 'user',
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      return userCredential.user
    } catch (error: any) {
      throw new Error(error.message)
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Check if user document exists, create if missing
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist (for existing Firebase Auth users)
        // Check if this is the first user (make them Admin)
        const allUsers = await getDocs(collection(db, 'users'))
        const isFirstUser = allUsers.empty

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          displayName: userCredential.user.displayName || '',
          role: isFirstUser ? 'admin' : 'user',
          isBlocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      } else {
        // Check if user is blocked
        if (userDoc.data().isBlocked) {
          await firebaseSignOut(auth)
          throw new Error('User account is blocked')
        }
      }

      return userCredential.user
    } catch (error: any) {
      throw new Error(error.message)
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth)
    } catch (error: any) {
      throw new Error(error.message)
    }
  },

  // Get current user
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser
  },

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const data = userDoc.data()

        // Helper function to safely normalize role
        const safeNormalizeRole = (role: any): 'admin' | 'manager' | 'user' | 'customer' => {
          if (!role) {
            console.warn(`[DEBUG] User ${uid} has missing or undefined role field`)
            return 'user'
          }
          if (typeof role !== 'string') {
            console.warn(`[DEBUG] User ${uid} has invalid role type:`, typeof role, role)
            return 'user'
          }
          const normalized = (role || '').toLowerCase().trim()
          if (normalized === 'admin' || normalized === 'manager' || normalized === 'user' || normalized === 'customer') {
            return normalized as 'admin' | 'manager' | 'user' | 'customer'
          }
          console.warn(`[DEBUG] User ${uid} has invalid role value:`, role, '-> normalized to user')
          return 'user'
        }

        const roleValue = data?.role
        const normalizedRole = safeNormalizeRole(roleValue)

        // Debug log if role was missing or invalid
        if (!roleValue || typeof roleValue !== 'string') {
          console.warn(`[DEBUG] User profile ${uid}:`, {
            userId: uid,
            email: data?.email || 'missing',
            role: roleValue || 'MISSING',
            normalizedRole,
            allFields: Object.keys(data || {})
          })
        }

        return {
          id: uid,
          email: data?.email && typeof data.email === 'string' ? data.email : '',
          displayName: data?.displayName && typeof data.displayName === 'string' ? data.displayName : 'Unknown User',
          role: normalizedRole,
          isBlocked: data?.isBlocked === true,
          createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        } as User
      }
      return null
    } catch (error: any) {
      throw new Error(error.message)
    }
  },
}
