// Users Application Layer
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/core/logger/logger'
import { UnauthorizedError } from '@/core/errors/AppError'
import { userRepository } from '../infrastructure/user-repository'
import type { User } from '../domain/types'

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) throw new UnauthorizedError('User not authenticated')

    try {
      return await userRepository.getAll()
    } catch (error: any) {
      logger.error('Failed to fetch users', error)
      throw new Error(`Failed to fetch users: ${error.message}`)
    }
  },

  async toggleBlockUser(userId: string, isBlocked: boolean): Promise<void> {
    try {
      await userRepository.setActive(userId, !isBlocked)
      logger.info('User block status toggled', { userId, isBlocked: !isBlocked })
    } catch (error: any) {
      logger.error('Failed to toggle block user', error, { userId })
      throw new Error(`Failed to update user block status: ${error.message}`)
    }
  },

  async updateUserPhone(userId: string, phoneNumber: string): Promise<void> {
    try {
      await userRepository.updatePhone(userId, phoneNumber)
      logger.info('User phone updated', { userId })
    } catch (error: any) {
      logger.error('Failed to update user phone', error, { userId })
      throw new Error(`Failed to update user phone number: ${error.message}`)
    }
  },

  async updateUserRole(userId: string, role: 'admin' | 'manager' | 'customer'): Promise<void> {
    try {
      await userRepository.updateRole(userId, role)
      logger.info('User role updated', { userId, role })
    } catch (error: any) {
      logger.error('Failed to update user role', error, { userId })
      throw new Error(`Failed to update user role: ${error.message}`)
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await userRepository.delete(userId)
      logger.info('User deleted', { userId })
    } catch (error: any) {
      logger.error('Failed to delete user', error, { userId })
      throw new Error(`Failed to delete user: ${error.message}`)
    }
  },

  async getUserOrders(userId: string) {
    try {
      return await userRepository.getOrdersByUser(userId)
    } catch (error: any) {
      logger.error('Failed to fetch user orders', error, { userId })
      throw new Error(`Failed to fetch user orders: ${error.message}`)
    }
  },

  async getHighValueCustomers(): Promise<any[]> {
    try {
      return await userRepository.getHighValueCustomers()
    } catch (error: any) {
      logger.error('Failed to fetch high-value customers', error)
      throw new Error(`Failed to fetch high-value customers: ${error.message}`)
    }
  },
}
