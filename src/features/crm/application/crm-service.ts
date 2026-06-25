// CRM Application Layer
import { logger } from '@/core/logger/logger'
import { crmRepository } from '../infrastructure/crm-repository'
import type { CRMAction, Lead, EmailTemplate, Email, Banner } from '../domain/types'
import { productService } from '@/features/products'
import { orderService } from '@/features/orders'

export const crmToolsService = {
  async scheduleEmailCampaign(
    campaignName: string,
    templateId: string,
    targetSegment: CRMAction['targetSegment'],
    scheduledFor: Date
  ): Promise<string> {
    try {
      const id = await crmRepository.insertAction({
        name: campaignName,
        type: 'email_campaign',
        status: 'scheduled',
        target_segment: targetSegment,
        template_id: templateId,
        scheduled_for: scheduledFor.toISOString(),
      })
      logger.info('Email campaign scheduled', { campaignId: id })
      return id
    } catch (error: any) {
      logger.error('Failed to schedule email campaign', error)
      throw new Error(`Failed to schedule email campaign: ${error.message}`)
    }
  },

  async scheduleRecurringReminder(
    medicineIds: string[],
    reminderFrequency: number,
    customerSegment: 'prescription' | 'all'
  ): Promise<void> {
    try {
      const products = await productService.getAllProducts()
      const filteredProducts = products.filter((p) => medicineIds.includes(p.id!))

      for (const product of filteredProducts) {
        const nextReminderDate = new Date()
        nextReminderDate.setDate(nextReminderDate.getDate() + reminderFrequency)

        await crmRepository.insertAction({
          type: 'reminder_task',
          status: 'scheduled',
          target_segment: customerSegment,
          medicine_id: product.id,
          medicine_name: product.name,
          reminder_frequency: reminderFrequency,
          scheduled_for: nextReminderDate.toISOString(),
        })
      }
      logger.info('Recurring reminders scheduled', { medicineCount: filteredProducts.length })
    } catch (error: any) {
      logger.error('Failed to schedule recurring reminders', error)
      throw new Error(`Failed to schedule recurring reminders: ${error.message}`)
    }
  },

  async executeScheduledActions(): Promise<void> {
    const actions = await crmRepository.getScheduledActions()
    const now = new Date()

    for (const action of actions) {
      if (action.status === 'scheduled' && action.scheduledFor <= now) {
        try {
          await crmRepository.updateActionStatus(action.id!, 'completed', new Date().toISOString())
        } catch (err) {
          await crmRepository.updateActionStatus(action.id!, 'failed')
        }
      }
    }
  },

  async getCustomerLifetimeValue(userId: string): Promise<number> {
    const orders = await orderService.getOrders()
    const userOrders = orders.filter((o: any) => o.user_id === userId)
    return userOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || o.total_amount || 0), 0)
  },
}

export const leadService = {
  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = await crmRepository.insertLead(leadData)
      logger.info('Lead created', { leadId: id })
      return id
    } catch (error: any) {
      logger.error('Failed to create lead', error)
      throw new Error(`Failed to create lead: ${error.message}`)
    }
  },

  async updateLead(id: string, leadData: Partial<Lead>): Promise<void> {
    try {
      await crmRepository.updateLead(id, leadData)
      logger.info('Lead updated', { leadId: id })
    } catch (error: any) {
      logger.error('Failed to update lead', error, { leadId: id })
      throw new Error(`Failed to update lead: ${error.message}`)
    }
  },

  async getAllLeads(): Promise<Lead[]> {
    return crmRepository.getAllLeads()
  },

  async getLeadsByStage(stage: Lead['stage']): Promise<Lead[]> {
    const leads = await this.getAllLeads()
    return leads.filter((l) => l.stage === stage)
  },

  async getConversionRate(): Promise<number> {
    const allLeads = await this.getAllLeads()
    const converted = allLeads.filter((l) => l.stage === 'converted')
    return allLeads.length > 0 ? (converted.length / allLeads.length) * 100 : 0
  },
}

export const emailService = {
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return crmRepository.getEmailTemplates()
  },

  async saveEmailTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt'>): Promise<string> {
    return crmRepository.insertEmailTemplate(template)
  },

  replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let content = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value)
    })
    return content
  },

  async sendEmailBatch(recipientEmails: string[], subject: string, htmlContent: string): Promise<void> {
    const getBaseUrl = () => {
      if (typeof window !== 'undefined') return window.location.origin
      if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
      if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
      return 'http://localhost:3000'
    }

    const apiUrl = `${getBaseUrl()}/api/send-email`

    for (const email of recipientEmails) {
      await crmRepository.queueEmail({
        to: email,
        from: 'noreply@medicinecrm.com',
        subject,
        htmlContent,
        status: 'pending',
      })

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: email, subject, html: htmlContent }),
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(text)
        }
      } catch (err: any) {
        logger.error(`Failed to send email to ${email}`, err)
      }
    }
  },
}

export const bannerService = {
  async getBanners(): Promise<Banner[]> {
    return crmRepository.getBanners()
  },

  async addBanner(data: any): Promise<void> {
    try {
      await crmRepository.insertBanner(data)
      logger.info('Banner added')
    } catch (error: any) {
      logger.error('Failed to add banner', error)
      throw new Error(`Failed to add banner: ${error.message}`)
    }
  },

  async updateBanner(id: string, updates: any): Promise<void> {
    try {
      await crmRepository.updateBanner(id, updates)
      logger.info('Banner updated', { bannerId: id })
    } catch (error: any) {
      logger.error('Failed to update banner', error)
      throw new Error(`Failed to update banner: ${error.message}`)
    }
  },

  async deleteBanner(id: string): Promise<void> {
    try {
      await crmRepository.deleteBanner(id)
      logger.info('Banner deleted', { bannerId: id })
    } catch (error: any) {
      logger.error('Failed to delete banner', error)
      throw new Error(`Failed to delete banner: ${error.message}`)
    }
  },
}
