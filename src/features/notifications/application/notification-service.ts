// Notifications Application Layer
import { logger } from '@/core/logger/logger'
import { notificationRepository } from '../infrastructure/notification-repository'

export const notificationService = {
  async addNotification(data: any): Promise<void> {
    try {
      await notificationRepository.insert(data)
      logger.info('Notification added', { type: data.type, userId: data.user_id })
    } catch (error: any) {
      logger.error('Failed to add notification', error)
      throw new Error(`Failed to add notification: ${error.message}`)
    }
  },

  async getNotifications() {
    try {
      return await notificationRepository.getAll()
    } catch (error: any) {
      logger.error('Failed to fetch notifications', error)
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }
  },

  async getUserNotifications(userId: string) {
    try {
      return await notificationRepository.getByUser(userId)
    } catch (error: any) {
      logger.error('Failed to fetch user notifications', error, { userId })
      throw new Error(`Failed to fetch user notifications: ${error.message}`)
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      await notificationRepository.markAsRead(id)
    } catch (error: any) {
      logger.error('Failed to mark notification as read', error, { notificationId: id })
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await notificationRepository.markAllAsRead(userId)
    } catch (error: any) {
      logger.error('Failed to mark all notifications as read', error, { userId })
      throw new Error(`Failed to mark all notifications as read: ${error.message}`)
    }
  },

  async deleteNotification(id: string): Promise<void> {
    try {
      await notificationRepository.delete(id)
    } catch (error: any) {
      logger.error('Failed to delete notification', error, { notificationId: id })
      throw new Error(`Failed to delete notification: ${error.message}`)
    }
  },
}
