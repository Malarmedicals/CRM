// Notifications Infrastructure Layer
import { supabase } from '@/lib/supabase/client'

const TABLE = 'notifications'

export const notificationRepository = {
  async insert(data: any): Promise<void> {
    const { error } = await supabase.from(TABLE).insert(data)
    if (error) throw error
  },

  async getAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map((doc: any) => ({ id: doc.id, ...doc, createdAt: new Date(doc.created_at || Date.now()) }))
  },

  async getByUser(userId: string) {
    const { data, error } = await supabase
      .from(TABLE).select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) throw error
    return data.map((doc: any) => ({ id: doc.id, ...doc, createdAt: new Date(doc.created_at || Date.now()) }))
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).update({ is_read: true }).eq('id', id)
    if (error) throw error
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase.from(TABLE).update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },
}
