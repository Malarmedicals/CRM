import { z } from 'zod'

export interface CRMAction {
  id?: string
  type: 'email_campaign' | 'reminder_task' | 'follow_up'
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed'
  targetSegment: 'all' | 'regular' | 'prescription' | 'high_value'
  templateId?: string
  scheduledFor: Date
  executedAt?: Date
  createdAt?: Date
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  stage: 'new' | 'contacted' | 'qualified' | 'converted'
  priority: 'low' | 'medium' | 'high'
  notes: string
  customerValue?: 'regular' | 'prescription' | 'high-value'
  createdAt: Date
  updatedAt: Date
}

export interface EmailTemplate {
  id?: string
  name: string
  subject: string
  htmlContent: string
  variables: string[]
  description?: string
  createdAt?: Date
}

export interface Email {
  id?: string
  to: string
  from: string
  subject: string
  htmlContent: string
  status: 'pending' | 'sent' | 'failed'
  sentAt?: Date
  failureReason?: string
  createdAt?: Date
}

export interface Banner {
  id: string
  title: string
  image: string
  mobileImage?: string
  link: string
  seoDescription: string
  isActive: boolean
  category?: string
  categoryTag?: string
  showCategoryTag?: boolean
  priceDisplay?: string
  description?: string
  seoTitle?: string
  linkProductId?: string
  bannerType?: 'Single Banner' | 'Grid' | 'Slider'
  createdAt: Date
  updatedAt: Date
}

export interface CRMAlert {
  id: string
  type: 'low_stock' | 'expiring_medicine'
  productId: string
  productName: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  resolved: boolean
  createdAt: Date
}

export interface WhatsAppTemplate {
  id: string
  name: string
  message: string
  description?: string
  createdAt?: Date
}
