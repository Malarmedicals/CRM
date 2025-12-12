import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Order, OrderItem } from '@/lib/models/types'
import { notificationService } from '@/features/notifications/notification-service'

// This service mimics the E-commerce side operations
export const ecommerceService = {
    // Simulate placing an order from the website
    async placeOrder(
        userId: string,
        customerName: string,
        customerPhone: string,
        items: OrderItem[],
        paymentMethod: string = 'COD'
    ) {
        try {
            const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

            const orderData: Omit<Order, 'id'> = {
                userId,
                customerName,
                customerPhone,
                products: items,
                totalAmount,
                status: 'pending',
                paymentMethod,
                deliveryStatus: 'pending',
                prescriptionVerified: false,
                createdAt: new Date(), // Local time for UI optimistically, serverTimestamp for DB
                updatedAt: new Date(),
                isNew: true // Trigger Notification Flag
            }

            // 1. Create the Order in Firestore
            const docRef = await addDoc(collection(db, 'orders'), {
                ...orderData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            })

            const orderId = docRef.id

            // 2. Trigger CRM Notification - Handled by Admin Listener now!
            /*
            await notificationService.create({
                title: 'New Order Received',
                message: `Order #${orderId.slice(0, 6).toUpperCase()} placed by ${customerName}. Amount: ₹${totalAmount}`,
                type: 'order',
                link: `/dashboard/orders?id=${orderId}`, // direct link to order details
                metadata: {
                    orderId,
                    amount: totalAmount
                }
            })
            */

            return orderId

        } catch (error) {
            console.error('Failed to place order:', error)
            throw error
        }
    }
}
