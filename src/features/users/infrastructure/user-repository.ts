// Users infrastructure layer
import { supabase } from '@/lib/supabase/client'
import type { User } from '../domain/types'

const USERS_TABLE = 'users'
const ORDERS_TABLE = 'orders'

function mapDbRowToUser(doc: any): User {
  return {
    id: doc.uid,
    email: doc.email || '',
    displayName: doc.display_name || 'Unknown User',
    phoneNumber: doc.phone_number,
    role: doc.role || 'customer',
    isBlocked: doc.is_active === false,
    createdAt: new Date(doc.created_at || Date.now()),
    updatedAt: new Date(doc.updated_at || Date.now()),
  }
}

export const userRepository = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase.from(USERS_TABLE).select('*')
    if (error) throw error
    return data.map(mapDbRowToUser)
  },

  async setActive(userId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from(USERS_TABLE)
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('uid', userId)
    if (error) throw error
  },

  async updatePhone(userId: string, phoneNumber: string): Promise<void> {
    const { error } = await supabase
      .from(USERS_TABLE)
      .update({ phone_number: phoneNumber, updated_at: new Date().toISOString() })
      .eq('uid', userId)
    if (error) throw error
  },

  async updateRole(userId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from(USERS_TABLE)
      .update({ role, updated_at: new Date().toISOString() })
      .eq('uid', userId)
    if (error) throw error
  },

  async delete(userId: string): Promise<void> {
    const { error } = await supabase.from(USERS_TABLE).delete().eq('uid', userId)
    if (error) throw error
  },

  async getOrdersByUser(userId: string): Promise<any[]> {
    const { data, error } = await supabase.from(ORDERS_TABLE).select('*').eq('user_id', userId)
    if (error) throw error
    return data.map((doc: any) => ({
      id: doc.id,
      ...doc,
      createdAt: new Date(doc.created_at || Date.now()),
      updatedAt: new Date(doc.updated_at || Date.now()),
    }))
  },

  async getHighValueCustomers(): Promise<any[]> {
    const { data, error } = await supabase.from(USERS_TABLE).select('*').eq('customer_value', 'high-value')
    if (error) throw error
    return data.map((doc: any) => ({
      id: doc.uid,
      ...doc,
      createdAt: new Date(doc.created_at || Date.now()),
      updatedAt: new Date(doc.updated_at || Date.now()),
    }))
  },
}
