import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { emailService } from './email-service'
import { orderService } from '@/features/orders/order-service'
import { userService } from '@/features/users/user-service'

export interface Notification {
  id?: string
  userId: string
  type: 'reminder' | 'alert' | 'promotion' | 'order_update'
  title: string
  message: string
  read: boolean
  createdAt?: Date
  expiresAt?: Date
}

export const notificationService = {
  // Create notification
  async createNotification(
    notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        read: false,
        createdAt: Timestamp.now(),
        expiresAt: notification.expiresAt ? Timestamp.fromDate(notification.expiresAt) : null,
      })
      return docRef.id
    } catch (error: any) {
      throw new Error(`Failed to create notification: ${error.message}`)
    }
  },

  // Get user notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
      } as Notification))
    } catch (error: any) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      })
    } catch (error: any) {
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }
  },

  // Send reminder for recurring purchases
  async sendRecurringPurchaseReminder(userId: string, medicineDetails: {
    medicineName: string
    frequency: string
    daysUntilDue: number
  }): Promise<void> {
    try {
      const userOrders = await orderService.getAllOrders() // In production, filter by userId
      const filteredOrders = userOrders.filter((order) => order.userId === userId)

      if (filteredOrders.length > 0) {
        // Create in-app notification
        await this.createNotification({
          userId,
          type: 'reminder',
          title: `Time for your ${medicineDetails.medicineName}`,
          message: `You're due for a refill of ${medicineDetails.medicineName} (${medicineDetails.frequency}). Order now to maintain your supply.`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
        })
      }
    } catch (error: any) {
      throw new Error(`Failed to send reminder: ${error.message}`)
    }
  },

  // Segment customers based on purchase behavior
  async segmentCustomers(): Promise<{
    regular: string[]
    prescription: string[]
    highValue: string[]
  }> {
    try {
      const users = await userService.getAllUsers()
      const orders = await orderService.getAllOrders()

      const segments = {
        regular: [] as string[],
        prescription: [] as string[],
        highValue: [] as string[],
      }

      // Simple segmentation logic
      for (const user of users) {
        // Only include users with valid email addresses
        if (!user.email || user.email.trim() === '') {
          console.warn(`User ${user.id} has no email address, skipping`)
          continue
        }

        const userOrders = orders.filter((order) => order.userId === user.id)
        const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

        if (totalSpent > 1000) {
          segments.highValue.push(user.email)
        } else if (userOrders.some((order) => order.prescriptionVerified)) {
          segments.prescription.push(user.email)
        } else if (userOrders.length > 0) {
          segments.regular.push(user.email)
        }
      }

      console.log('📋 Segmentation complete:', {
        totalUsers: users.length,
        usersWithOrders: users.filter(u => orders.some(o => o.userId === u.id)).length,
        segments: {
          regular: segments.regular,
          prescription: segments.prescription,
          highValue: segments.highValue
        }
      })

      return segments
    } catch (error: any) {
      throw new Error(`Failed to segment customers: ${error.message}`)
    }
  },

  // Send targeted email to customer segment
  async sendSegmentedEmail(
    segment: 'regular' | 'prescription' | 'highValue',
    templateName: string,
    customVariables?: Record<string, string>
  ): Promise<void> {
    try {
      const segments = await this.segmentCustomers()
      const recipients = segments[segment]

      if (recipients.length === 0) {
        throw new Error(`No customers found in ${segment} segment`)
      }

      await emailService.sendPromotionalEmail(recipients, templateName, customVariables || {})
    } catch (error: any) {
      throw new Error(`Failed to send segmented email: ${error.message}`)
    }
  },

  // Send segmented email with direct content
  async sendSegmentedEmailDirect(
    segment: 'regular' | 'prescription' | 'highValue' | 'all',
    subject: string,
    htmlContent: string
  ): Promise<void> {
    try {
      const segments = await this.segmentCustomers()
      let recipients: string[] = []

      console.log('📊 Customer Segmentation Results:', {
        regular: segments.regular.length,
        prescription: segments.prescription.length,
        highValue: segments.highValue.length,
        selectedSegment: segment
      })

      if (segment === 'all') {
        // Combine all unique emails
        const allEmails = new Set([
          ...segments.regular,
          ...segments.prescription,
          ...segments.highValue
        ])
        recipients = Array.from(allEmails)
      } else {
        recipients = segments[segment]
      }

      if (recipients.length === 0) {
        // Fallback for demo purposes if no users exist
        console.warn(`No customers found in ${segment} segment. Using demo emails.`)
        recipients = ['demo@example.com', 'test@example.com']
      }

      console.log(`📧 Sending email campaign to ${recipients.length} recipient(s):`, recipients)

      await emailService.sendEmailBatch(recipients, subject, htmlContent)
    } catch (error: any) {
      throw new Error(`Failed to send segmented email: ${error.message}`)
    }
  },

  // Bulk notification for alerts
  async sendBulkAlertNotification(
    userIds: string[],
    title: string,
    message: string,
    type: 'alert' | 'promotion' = 'alert'
  ): Promise<void> {
    try {
      for (const userId of userIds) {
        await this.createNotification({
          userId,
          type,
          title,
          message,
        })
      }
    } catch (error: any) {
      throw new Error(`Failed to send bulk notifications: ${error.message}`)
    }
  },
}
