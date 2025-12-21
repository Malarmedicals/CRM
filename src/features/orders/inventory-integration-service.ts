import { inventoryService } from '../products/inventory-service'
import { Order, OrderItem } from '@/lib/models/types'
import { notificationService } from '../notifications/notification-service'

/**
 * Inventory Integration Service
 * Handles automatic stock reduction when orders are delivered
 */
export const inventoryIntegrationService = {
    /**
     * Reduce stock for all products in an order
     * Called when order delivery status changes to 'delivered'
     */
    async reduceStockForOrder(order: Order): Promise<void> {
        if (!order.products || order.products.length === 0) {
            console.warn(`Order ${order.id} has no products to reduce stock for`)
            return
        }

        const errors: string[] = []
        const successfulUpdates: string[] = []

        for (const item of order.products) {
            try {
                await this.reduceStockForProduct(item, order.id)
                successfulUpdates.push(item.name || item.productName || item.productId)
            } catch (error: any) {
                const productName = item.name || item.productName || item.productId
                errors.push(`${productName}: ${error.message}`)
                console.error(`Failed to reduce stock for ${productName}:`, error)
            }
        }

        // Log summary
        console.log(`Stock reduction for order ${order.id}:`, {
            successful: successfulUpdates.length,
            failed: errors.length,
            products: successfulUpdates
        })

        // Create notification for low stock items if any
        await this.checkAndNotifyLowStock(order.products)

        // If there were errors, throw them
        if (errors.length > 0) {
            throw new Error(`Failed to reduce stock for some products: ${errors.join(', ')}`)
        }
    },

    /**
     * Reduce stock for a single product
     */
    async reduceStockForProduct(item: OrderItem, orderId: string): Promise<void> {
        if (!item.productId) {
            throw new Error(`Product ID missing for ${item.name || 'unknown product'}`)
        }

        const quantity = item.quantity || 0
        if (quantity <= 0) {
            console.warn(`Invalid quantity (${quantity}) for product ${item.productId}`)
            return
        }

        // Use inventory service to update stock
        await inventoryService.updateStock(
            item.productId,
            quantity,
            'out',
            `Order delivered: #${orderId.substring(0, 8)}`,
            `Automatic stock reduction for delivered order. Product: ${item.name || item.productName}`
        )
    },

    /**
     * Restore stock for an order (e.g., when order is cancelled after delivery)
     */
    async restoreStockForOrder(order: Order): Promise<void> {
        if (!order.products || order.products.length === 0) {
            console.warn(`Order ${order.id} has no products to restore stock for`)
            return
        }

        const errors: string[] = []

        for (const item of order.products) {
            try {
                if (!item.productId) {
                    throw new Error(`Product ID missing for ${item.name || 'unknown product'}`)
                }

                const quantity = item.quantity || 0
                if (quantity <= 0) continue

                await inventoryService.updateStock(
                    item.productId,
                    quantity,
                    'in',
                    `Order cancelled/returned: #${order.id.substring(0, 8)}`,
                    `Stock restored due to order cancellation/return. Product: ${item.name || item.productName}`
                )
            } catch (error: any) {
                const productName = item.name || item.productName || item.productId
                errors.push(`${productName}: ${error.message}`)
                console.error(`Failed to restore stock for ${productName}:`, error)
            }
        }

        if (errors.length > 0) {
            throw new Error(`Failed to restore stock for some products: ${errors.join(', ')}`)
        }
    },

    /**
     * Check for low stock and create notifications
     */
    async checkAndNotifyLowStock(products: OrderItem[]): Promise<void> {
        try {
            const lowStockProducts = await inventoryService.getLowStockProducts()

            // Check if any of the order products are now low stock
            for (const item of products) {
                const lowStockProduct = lowStockProducts.find(p => p.id === item.productId)

                if (lowStockProduct) {
                    // Create low stock notification
                    await notificationService.create({
                        type: 'inventory',
                        title: 'Low Stock Alert',
                        message: `${lowStockProduct.name} is running low. Current stock: ${lowStockProduct.stockQuantity}`,
                        metadata: {
                            productId: lowStockProduct.id,
                            productName: lowStockProduct.name,
                            currentStock: lowStockProduct.stockQuantity,
                            minStockLevel: lowStockProduct.minStockLevel || 10,
                            relatedId: lowStockProduct.id,
                            type: 'low_stock'
                        }
                    })
                }
            }
        } catch (error) {
            console.error('Failed to check/notify low stock:', error)
            // Don't throw - this is a non-critical operation
        }
    },

    /**
     * Validate if order can be delivered (check stock availability)
     */
    async validateStockForDelivery(order: Order): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = []

        if (!order.products || order.products.length === 0) {
            return { valid: false, errors: ['Order has no products'] }
        }

        try {
            const allProducts = await inventoryService.getAllProducts()

            for (const item of order.products) {
                if (!item.productId) {
                    errors.push(`Product "${item.name || 'unknown'}" has no product ID`)
                    continue
                }

                const product = allProducts.find(p => p.id === item.productId)

                if (!product) {
                    errors.push(`Product "${item.name || item.productId}" not found in inventory`)
                    continue
                }

                if (product.stockQuantity < item.quantity) {
                    errors.push(
                        `Insufficient stock for "${product.name}". ` +
                        `Required: ${item.quantity}, Available: ${product.stockQuantity}`
                    )
                }
            }

            return {
                valid: errors.length === 0,
                errors
            }
        } catch (error: any) {
            return {
                valid: false,
                errors: [`Failed to validate stock: ${error.message}`]
            }
        }
    }
}
