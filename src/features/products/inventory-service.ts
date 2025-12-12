import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    query,
    where,
    Timestamp,
    getDoc,
    orderBy,
    limit,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Product, StockMovement, ProductBatch } from '@/lib/models/types'

export const inventoryService = {
    // Get all products for inventory view
    async getAllProducts(): Promise<Product[]> {
        try {
            const querySnapshot = await getDocs(collection(db, 'products'))
            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                expiryDate: doc.data().expiryDate?.toDate(),
                lastRestocked: doc.data().lastRestocked?.toDate(),
            } as Product))
        } catch (error: any) {
            throw new Error(`Failed to fetch products: ${error.message}`)
        }
    },

    // Get low stock products
    async getLowStockProducts(): Promise<Product[]> {
        try {
            const products = await this.getAllProducts()
            return products.filter(product => {
                const minLevel = product.minStockLevel || 10
                return product.stockQuantity <= minLevel && product.stockQuantity > 0
            })
        } catch (error: any) {
            throw new Error(`Failed to fetch low stock products: ${error.message}`)
        }
    },

    // Get out of stock products
    async getOutOfStockProducts(): Promise<Product[]> {
        try {
            const products = await this.getAllProducts()
            return products.filter(product => product.stockQuantity === 0)
        } catch (error: any) {
            throw new Error(`Failed to fetch out of stock products: ${error.message}`)
        }
    },

    // Get products expiring soon
    async getExpiringProducts(daysThreshold: number = 30): Promise<Product[]> {
        try {
            const products = await this.getAllProducts()
            const thresholdDate = new Date()
            thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

            return products.filter(product => {
                if (!product.expiryDate) return false
                const expiryDate = new Date(product.expiryDate)
                return expiryDate <= thresholdDate && expiryDate >= new Date()
            }).sort((a, b) => {
                const dateA = new Date(a.expiryDate).getTime()
                const dateB = new Date(b.expiryDate).getTime()
                return dateA - dateB
            })
        } catch (error: any) {
            throw new Error(`Failed to fetch expiring products: ${error.message}`)
        }
    },

    // Update stock quantity
    async updateStock(
        productId: string,
        quantity: number,
        type: StockMovement['type'],
        reason: string,
        notes?: string
    ): Promise<void> {
        try {
            const currentUser = auth.currentUser
            if (!currentUser) {
                throw new Error('User not authenticated')
            }

            // Get current product data
            const productDoc = await getDoc(doc(db, 'products', productId))
            if (!productDoc.exists()) {
                throw new Error('Product not found')
            }

            const productData = productDoc.data() as Product
            const previousStock = productData.stockQuantity || 0

            // Calculate new stock based on type
            let newStock = previousStock
            if (type === 'in') {
                newStock = previousStock + quantity
            } else if (type === 'out' || type === 'expired' || type === 'damaged') {
                newStock = previousStock - quantity
                if (newStock < 0) newStock = 0
            } else if (type === 'adjustment') {
                newStock = quantity // Direct adjustment
            }

            // Prepare update data
            const updateData: any = {
                stockQuantity: newStock,
                updatedAt: Timestamp.now(),
            }

            // Only update lastRestocked if adding stock
            if (type === 'in') {
                updateData.lastRestocked = Timestamp.now()
            }

            // Update product stock
            await updateDoc(doc(db, 'products', productId), updateData)

            // Log stock movement
            await addDoc(collection(db, 'stockMovements'), {
                productId,
                productName: productData.name,
                type,
                quantity,
                reason,
                performedBy: currentUser.uid,
                performedByName: currentUser.displayName || currentUser.email,
                previousStock,
                newStock,
                timestamp: Timestamp.now(),
                notes: notes || '',
            })
        } catch (error: any) {
            throw new Error(`Failed to update stock: ${error.message}`)
        }
    },

    // Get stock movement history
    async getStockMovements(productId?: string, limitCount: number = 50): Promise<StockMovement[]> {
        try {
            let q
            if (productId) {
                q = query(
                    collection(db, 'stockMovements'),
                    where('productId', '==', productId),
                    orderBy('timestamp', 'desc'),
                    limit(limitCount)
                )
            } else {
                q = query(
                    collection(db, 'stockMovements'),
                    orderBy('timestamp', 'desc'),
                    limit(limitCount)
                )
            }

            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate(),
            } as StockMovement))
        } catch (error: any) {
            throw new Error(`Failed to fetch stock movements: ${error.message}`)
        }
    },

    // Get inventory statistics
    async getInventoryStats() {
        try {
            const products = await this.getAllProducts()
            const lowStock = await this.getLowStockProducts()
            const outOfStock = await this.getOutOfStockProducts()
            const expiringSoon = await this.getExpiringProducts(30)

            const totalValue = products.reduce((sum, product) => {
                return sum + (product.price * product.stockQuantity)
            }, 0)

            const totalItems = products.reduce((sum, product) => {
                return sum + product.stockQuantity
            }, 0)

            return {
                totalProducts: products.length,
                totalItems,
                totalValue,
                lowStockCount: lowStock.length,
                outOfStockCount: outOfStock.length,
                expiringSoonCount: expiringSoon.length,
            }
        } catch (error: any) {
            throw new Error(`Failed to fetch inventory stats: ${error.message}`)
        }
    },
}
