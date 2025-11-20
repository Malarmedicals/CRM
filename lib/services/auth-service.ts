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
      // Check if this is the first user (make them admin)
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
        // Check if this is the first user (make them admin)
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
        return {
          id: uid,
          ...userDoc.data(),
          createdAt: userDoc.data().createdAt?.toDate(),
          updatedAt: userDoc.data().updatedAt?.toDate(),
        } as User
      }
      return null
    } catch (error: any) {
      throw new Error(error.message)
    }
  },
}
