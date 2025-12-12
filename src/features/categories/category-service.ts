import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    Timestamp,
    arrayUnion
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface CategoryData {
    id: string
    name: string
    subcategories: string[]
    createdAt?: Date
    updatedAt?: Date
}

export const categoryService = {
    // Get all categories
    async getAllCategories(): Promise<CategoryData[]> {
        try {
            const querySnapshot = await getDocs(collection(db, 'categories'))
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert timestamps if needed, though usually we just want names/subcategories
            })) as CategoryData[]
        } catch (error: any) {
            console.error('Failed to fetch categories:', error)
            return []
        }
    },

    // Add a new main category
    async addCategory(name: string): Promise<void> {
        try {
            const categoryId = name.toLowerCase().replace(/\s+/g, '-')
            const docRef = doc(db, 'categories', categoryId)
            await setDoc(docRef, {
                id: categoryId,
                name: name,
                subcategories: [],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            })
        } catch (error: any) {
            throw new Error(`Failed to add category: ${error.message}`)
        }
    },

    // Add a subcategory to an existing main category
    async addSubcategory(categoryId: string, subcategoryName: string): Promise<void> {
        try {
            const docRef = doc(db, 'categories', categoryId)
            await updateDoc(docRef, {
                subcategories: arrayUnion(subcategoryName),
                updatedAt: Timestamp.now()
            })
        } catch (error: any) {
            throw new Error(`Failed to add subcategory: ${error.message}`)
        }
    },

    // Initialize default categories if empty (Helper function)
    async initializeDefaults(defaults: Record<string, { subcategories: string[] }>): Promise<void> {
        const existing = await this.getAllCategories()
        if (existing.length === 0) {
            console.log('Initializing default categories...')
            for (const [name, data] of Object.entries(defaults)) {
                const categoryId = name.toLowerCase().replace(/\s+/g, '-')
                await setDoc(doc(db, 'categories', categoryId), {
                    id: categoryId,
                    name: name,
                    subcategories: data.subcategories,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                })
            }
        }
    }
}
