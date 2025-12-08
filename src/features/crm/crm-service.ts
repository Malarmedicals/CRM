import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { notificationService } from './notification-service'
import { emailService } from './email-service'
import { productService } from '@/features/products/product-service'
import { orderService } from '@/features/orders/order-service'

export interface CRMAction {
  id?: string
  type: 'email_campaign' | 'reminder_task' | 'follow_up'
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed'
  targetSegment: 'all' | 'regular' | 'prescription' | 'high_value'
  templateId?: string
  scheduledFor: Date
  executedAt?: Date
  createdAt?: Date
}

export const crmToolsService = {
  // Schedule email campaign
  async scheduleEmailCampaign(
    campaignName: string,
    templateId: string,
    targetSegment: CRMAction['targetSegment'],
    scheduledFor: Date
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'crmActions'), {
        name: campaignName,
        type: 'email_campaign',
        status: 'scheduled',
        targetSegment,
        templateId,
        scheduledFor: Timestamp.fromDate(scheduledFor),
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error: any) {
      throw new Error(`Failed to schedule campaign: ${error.message}`)
    }
  },

  // Schedule recurring purchase reminders
  async scheduleRecurringReminder(
    medicineIds: string[],
    reminderFrequency: number, // in days
    customerSegment: 'prescription' | 'all'
  ): Promise<void> {
    try {
      const products = await productService.getAllProducts()
      const filteredProducts = products.filter((p) => medicineIds.includes(p.id))

      for (const product of filteredProducts) {
        // Create reminder for each product
        const nextReminderDate = new Date()
        nextReminderDate.setDate(nextReminderDate.getDate() + reminderFrequency)

        await addDoc(collection(db, 'crmActions'), {
          type: 'reminder_task',
          status: 'scheduled',
          targetSegment: customerSegment,
          medicineId: product.id,
          medicineName: product.name,
          reminderFrequency,
          scheduledFor: Timestamp.fromDate(nextReminderDate),
          createdAt: Timestamp.now(),
        })
      }
    } catch (error: any) {
      throw new Error(`Failed to schedule reminders: ${error.message}`)
    }
  },

  // Get scheduled actions
  async getScheduledActions(): Promise<CRMAction[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'crmActions'))
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        scheduledFor: doc.data().scheduledFor?.toDate(),
        executedAt: doc.data().executedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      } as CRMAction))
    } catch (error: any) {
      throw new Error(`Failed to fetch scheduled actions: ${error.message}`)
    }
  },

  // Execute scheduled actions
  async executeScheduledActions(): Promise<void> {
    try {
      const actions = await this.getScheduledActions()
      const now = new Date()

      for (const action of actions) {
        if (action.status === 'scheduled' && action.scheduledFor <= now) {
          try {
            if (action.type === 'email_campaign') {
              // Execute email campaign (in production, integrate with email service)
              await updateDoc(doc(db, 'crmActions', action.id!), {
                status: 'completed',
                executedAt: Timestamp.now(),
              })
            } else if (action.type === 'reminder_task') {
              // Execute reminder task
              await updateDoc(doc(db, 'crmActions', action.id!), {
                status: 'completed',
                executedAt: Timestamp.now(),
              })
            }
          } catch (err) {
            await updateDoc(doc(db, 'crmActions', action.id!), {
              status: 'failed',
            })
          }
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to execute scheduled actions: ${error.message}`)
    }
  },

  // Get customer lifetime value
  async getCustomerLifetimeValue(userId: string): Promise<number> {
    try {
      const orders = await orderService.getAllOrders()
      const userOrders = orders.filter((order) => order.userId === userId)
      return userOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    } catch (error: any) {
      throw new Error(`Failed to calculate customer lifetime value: ${error.message}`)
    }
  },

  // Get churn risk customers (no orders in 90 days)
  async getChurnRiskCustomers(): Promise<string[]> {
    try {
      const orders = await orderService.getAllOrders()
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const userLastOrders: Record<string, Date> = {}

      for (const order of orders) {
        const orderDate = new Date(order.createdAt)
        if (!userLastOrders[order.userId] || orderDate > userLastOrders[order.userId]) {
          userLastOrders[order.userId] = orderDate
        }
      }

      return Object.entries(userLastOrders)
        .filter(([, lastOrder]) => lastOrder < ninetyDaysAgo)
        .map(([userId]) => userId)
    } catch (error: any) {
      throw new Error(`Failed to get churn risk customers: ${error.message}`)
    }
  },
}
