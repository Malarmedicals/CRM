// Application service for whatsapp
import { logger } from '@/core/logger/logger'
import { supabase } from '@/lib/supabase/client'

export const whatsappService = {
  async getWhatsAppTemplates(): Promise<any[]> {
    const { data, error } = await supabase.from('whatsapp_templates').select('*')
    if (error) throw error
    return data.map((doc: any) => ({
      id: doc.id,
      ...doc,
      createdAt: new Date(doc.created_at || Date.now()),
    }))
  },

  async saveWhatsAppTemplate(template: any): Promise<string> {
    const { data, error } = await supabase.from('whatsapp_templates').insert(template).select().single()
    if (error) throw error
    return data.id
  },

  replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let content = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value)
    })
    return content
  },

  async queueMessage(message: any): Promise<string> {
    const { data, error } = await supabase.from('whatsapp_queue').insert({
      ...message,
      status: 'pending',
    }).select().single()
    if (error) throw error
    return data.id
  },

  async getPendingMessages(): Promise<any[]> {
    const { data, error } = await supabase.from('whatsapp_queue').select('*').eq('status', 'pending')
    if (error) throw error
    return data.map((doc: any) => ({
      id: doc.id,
      ...doc,
      createdAt: new Date(doc.created_at || Date.now()),
      sentAt: doc.sent_at ? new Date(doc.sent_at) : undefined,
    }))
  },

  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    const getBaseUrl = () => {
      if (typeof window !== 'undefined') return window.location.origin
      if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
      if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
      return 'http://localhost:3000'
    }

    const apiUrl = `${getBaseUrl()}/api/send-whatsapp`

    await this.queueMessage({ to: phoneNumber, message, status: 'pending' })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phoneNumber, message }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WhatsApp API returned ${response.status}: ${errorText}`)
    }
  },

  async sendBatchMessages(phoneNumbers: string[], message: string): Promise<void> {
    for (const phoneNumber of phoneNumbers) {
      await this.sendMessage(phoneNumber, message)
    }
  },
}
