// CRM Notification Application Service
import { logger } from '@/core/logger/logger'
import { notificationService as baseNotificationService } from '@/features/notifications/application/notification-service'
import { emailService } from './crm-service'
import { orderService } from '@/features/orders'
import { userService } from '@/features/users'

export const crmNotificationService = {
  async createNotification(notification: any): Promise<void> {
    await baseNotificationService.addNotification({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      is_read: false,
    })
  },

  async getUserNotifications(userId: string): Promise<any[]> {
    return baseNotificationService.getUserNotifications(userId)
  },

  async markAsRead(notificationId: string): Promise<void> {
    await baseNotificationService.markAsRead(notificationId)
  },

  async sendRecurringPurchaseReminder(userId: string, medicineDetails: any): Promise<void> {
    const userOrders = await orderService.getOrders()
    const filteredOrders = userOrders.filter((order: any) => order.user_id === userId)

    if (filteredOrders.length > 0) {
      await this.createNotification({
        userId,
        type: 'reminder',
        title: `Time for your ${medicineDetails.medicineName}`,
        message: `You're due for a refill of ${medicineDetails.medicineName}.`,
      })
    }
  },

  async segmentCustomers() {
    const users = await userService.getAllUsers()
    const orders = await orderService.getOrders()

    const segments = { regular: [] as string[], prescription: [] as string[], highValue: [] as string[] }

    for (const user of users) {
      if (!user.email || user.email.trim() === '') continue
      const userOrders = orders.filter((order: any) => order.user_id === user.id)
      const totalSpent = userOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)

      if (totalSpent > 1000) segments.highValue.push(user.email)
      else if (userOrders.some((order: any) => order.prescription_verified)) segments.prescription.push(user.email)
      else if (userOrders.length > 0) segments.regular.push(user.email)
    }

    return segments
  },

  async sendSegmentedEmail(segment: any, templateName: string, customVariables?: any) {
    const segments = await this.segmentCustomers()
    const recipients = segments[segment as keyof typeof segments] || []
    if (recipients.length === 0) throw new Error(`No customers found`)
    // Implementation for sendPromotionalEmail would be needed in emailService, using sendEmailBatch for now
    await emailService.sendEmailBatch(recipients, 'Promotional Offer', 'Please check our latest offers.')
  },

  async sendSegmentedEmailDirect(segment: string, subject: string, htmlContent: string) {
    const segments = await this.segmentCustomers()
    let recipients: string[] = []
    if (segment === 'all') {
      recipients = Array.from(new Set([...segments.regular, ...segments.prescription, ...segments.highValue]))
    } else {
      recipients = segments[segment as keyof typeof segments] || []
    }

    if (recipients.length === 0) recipients = ['demo@example.com']
    await emailService.sendEmailBatch(recipients, subject, htmlContent)
  },

  async sendBulkAlertNotification(userIds: string[], title: string, message: string, type: 'alert' | 'promotion' = 'alert') {
    for (const userId of userIds) {
      await this.createNotification({ userId, type, title, message })
    }
  },
}
