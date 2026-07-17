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
    const { data, error } = await supabase.from('banners').select('*').order('displayOrder', { ascending: true }).order('createdAt', { ascending: false })
    if (error) throw error
    return data.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      position: doc.position,
      redirectType: doc.redirect_type,
      redirectTarget: doc.redirect_target,
      openIn: doc.open_in,
      status: doc.status,
      displayOrder: doc.displayOrder,
      image: doc.image_url,
      altText: doc.alt_text,
      startDate: doc.start_date ? new Date(doc.start_date) : undefined,
      endDate: doc.end_date ? new Date(doc.end_date) : undefined,
      createdBy: doc.created_by,
      updatedBy: doc.updated_by,
      createdAt: new Date(doc.createdAt || Date.now()),
      updatedAt: new Date(doc.updatedAt || Date.now()),
    }))
  },

  async insertBanner(bannerData: any): Promise<void> {
    const payload = {
      name: bannerData.name,
      position: bannerData.position,
      redirect_type: bannerData.redirectType,
      redirect_target: bannerData.redirectTarget,
      open_in: bannerData.openIn,
      status: bannerData.status,
      displayOrder: bannerData.displayOrder, // Schema has "displayOrder"
      image_url: bannerData.image,
      alt_text: bannerData.altText,
      start_date: bannerData.startDate ? new Date(bannerData.startDate).toISOString() : null,
      end_date: bannerData.endDate ? new Date(bannerData.endDate).toISOString() : null,
      created_by: bannerData.createdBy,
      updated_by: bannerData.updatedBy
    }
    const { error } = await supabase.from('banners').insert(payload)
    if (error) throw error
  },

  async updateBanner(id: string, updates: any): Promise<void> {
    const payload: any = { updatedAt: new Date().toISOString() }
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.position !== undefined) payload.position = updates.position
    if (updates.redirectType !== undefined) payload.redirect_type = updates.redirectType
    if (updates.redirectTarget !== undefined) payload.redirect_target = updates.redirectTarget
    if (updates.openIn !== undefined) payload.open_in = updates.openIn
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.displayOrder !== undefined) payload.displayOrder = updates.displayOrder
    if (updates.image !== undefined) payload.image_url = updates.image
    if (updates.altText !== undefined) payload.alt_text = updates.altText
    if (updates.startDate !== undefined) payload.start_date = updates.startDate ? new Date(updates.startDate).toISOString() : null
    if (updates.endDate !== undefined) payload.end_date = updates.endDate ? new Date(updates.endDate).toISOString() : null

    const { error } = await supabase.from('banners').update(payload).eq('id', id)
    if (error) throw error
  },

  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) throw error
  },

  async uploadImage(file: Blob, filename: string): Promise<string> {
    const { data, error } = await supabase.storage.from('banners').upload(filename, file, {
      contentType: file.type || 'image/jpeg',
    })
    if (error) throw error
    const { data: publicUrlData } = supabase.storage.from('banners').getPublicUrl(filename)
    return publicUrlData.publicUrl
  },
}
