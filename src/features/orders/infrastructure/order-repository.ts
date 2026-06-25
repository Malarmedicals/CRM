// Orders Infrastructure Layer
import { supabase } from '@/lib/supabase/client'
import type { Order } from '../domain/types'

const ORDERS_TABLE = 'orders'

function mapDbRowToOrder(doc: any): Order {
  return {
    id: doc.id,
    ...doc,
    createdAt: new Date(doc.created_at || Date.now()),
    updatedAt: new Date(doc.updated_at || Date.now()),
  }
}

export const orderRepository = {
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapDbRowToOrder)
  },

  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase.from(ORDERS_TABLE).select('*').eq('id', id).single()
    if (error || !data) return null
    return mapDbRowToOrder(data)
  },

  async insert(orderData: any): Promise<string> {
    const { data, error } = await supabase.from(ORDERS_TABLE).insert(orderData).select().single()
    if (error) throw error
    return data.id
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from(ORDERS_TABLE)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async update(id: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from(ORDERS_TABLE)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(ORDERS_TABLE).delete().eq('id', id)
    if (error) throw error
  },
}
