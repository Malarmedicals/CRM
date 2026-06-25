// Prescriptions Infrastructure Layer
import { supabase } from '@/lib/supabase/client'
import type { Prescription } from '../domain/types'

const TABLE = 'prescriptions'

function mapDbRowToPrescription(doc: any): Prescription {
  return {
    id: doc.id,
    ...doc,
    createdAt: new Date(doc.created_at || Date.now()),
    updatedAt: new Date(doc.updated_at || Date.now()),
  }
}

export const prescriptionRepository = {
  async insert(data: any): Promise<void> {
    const { error } = await supabase.from(TABLE).insert(data)
    if (error) throw error
  },

  async getAll(): Promise<Prescription[]> {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapDbRowToPrescription)
  },

  async getById(id: string): Promise<Prescription | null> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single()
    if (error || !data) return null
    return mapDbRowToPrescription(data)
  },

  async updateStatus(id: string, status: string, notes?: string): Promise<void> {
    const updateData: any = { status, updated_at: new Date().toISOString() }
    if (notes) updateData.notes = notes
    const { error } = await supabase.from(TABLE).update(updateData).eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },
}
