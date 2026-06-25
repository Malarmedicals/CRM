// CRM Infrastructure Layer
import { supabase } from '@/lib/supabase/client'
import type { CRMAction, Lead, EmailTemplate, Email, Banner } from '../domain/types'

export const crmRepository = {
  // CRM Actions
  async insertAction(action: any): Promise<string> {
    const { data, error } = await supabase.from('crm_actions').insert(action).select().single()
    if (error) throw error
    return data.id
  },

  async getScheduledActions(): Promise<CRMAction[]> {
    const { data, error } = await supabase.from('crm_actions').select('*')
    if (error) throw error
    return data.map((doc: any) => ({
      id: doc.id,
      ...doc,
      scheduledFor: new Date(doc.scheduled_for),
      executedAt: doc.executed_at ? new Date(doc.executed_at) : undefined,
      createdAt: new Date(doc.created_at || Date.now()),
    }))
  },

  async updateActionStatus(id: string, status: string, executedAt?: string): Promise<void> {
    const payload: any = { status }
    if (executedAt) payload.executed_at = executedAt
    const { error } = await supabase.from('crm_actions').update(payload).eq('id', id)
    if (error) throw error
  },

  // Leads
  async insertLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const { data, error } = await supabase.from('leads').insert(leadData).select().single()
    if (error) throw error
    return data.id
  },

  async updateLead(id: string, leadData: Partial<Lead>): Promise<void> {
    const { error } = await supabase.from('leads').update({
      ...leadData,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) throw error
  },

  async getAllLeads(): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('*')
    if (error) throw error
    return data.map((doc: any) => ({
      id: doc.id,
      ...doc,
      createdAt: new Date(doc.created_at || Date.now()),
      updatedAt: new Date(doc.updated_at || Date.now()),
    }))
  },

  // Emails
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase.from('email_templates').select('*')
    if (error) throw error
    return data.map((doc: any) => ({
      id: doc.id,
      ...doc,
      createdAt: new Date(doc.created_at || Date.now()),
    }))
  },

  async insertEmailTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt'>): Promise<string> {
    const { data, error } = await supabase.from('email_templates').insert(template).select().single()
    if (error) throw error
    return data.id
  },

  async getTemplateByName(name: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase.from('email_templates').select('*').eq('name', name).single()
    if (error || !data) return null
    return { id: data.id, ...data, createdAt: new Date(data.created_at || Date.now()) }
  },

  async queueEmail(email: Omit<Email, 'id' | 'createdAt'>): Promise<string> {
    const { data, error } = await supabase.from('email_queue').insert({ ...email, status: 'pending' }).select().single()
    if (error) throw error
    return data.id
  },

  // Banners
  async getBanners(): Promise<Banner[]> {
    const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data.map((doc: any) => ({
      id: doc.id,
      ...doc,
      createdAt: new Date(doc.created_at || Date.now()),
      updatedAt: new Date(doc.updated_at || Date.now()),
    }))
  },

  async insertBanner(bannerData: any): Promise<void> {
    const { error } = await supabase.from('banners').insert(bannerData)
    if (error) throw error
  },

  async updateBanner(id: string, updates: any): Promise<void> {
    const { error } = await supabase.from('banners').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  },

  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) throw error
  },
}
