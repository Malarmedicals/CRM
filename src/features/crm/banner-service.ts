import { db, storage } from '@/lib/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Banner } from '@/lib/models/types'

const COLLECTION_NAME = 'banners'

export const bannerService = {
    async addBanner(bannerData: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...bannerData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            })
            return docRef.id
        } catch (error) {
            console.error('Error adding banner:', error)
            throw error
        }
    },

    async getBanners() {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as Banner[]
        } catch (error) {
            console.error('Error getting banners:', error)
            throw error
        }
    },

    async getBannerById(id: string) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt?.toDate(),
                    updatedAt: docSnap.data().updatedAt?.toDate(),
                } as Banner
            }
            return null
        } catch (error) {
            console.error('Error getting banner:', error)
            throw error
        }
    },

    async updateBanner(id: string, updates: Partial<Banner>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id)
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            })
        } catch (error) {
            console.error('Error updating banner:', error)
            throw error
        }
    },

    async deleteBanner(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id))
        } catch (error) {
            console.error('Error deleting banner:', error)
            throw error
        }
    },

    async uploadImage(file: Blob, path: string) {
        try {
            const storageRef = ref(storage, path)
            const snapshot = await uploadBytes(storageRef, file)
            return await getDownloadURL(snapshot.ref)
        } catch (error) {
            console.error('Error uploading image:', error)
            throw error
        }
    }
}
