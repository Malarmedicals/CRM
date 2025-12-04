import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'

export interface EmailTemplate {
  id?: string
  name: string
  subject: string
  htmlContent: string
  variables: string[] // e.g., {{customerName}}, {{orderNumber}}
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

export const emailService = {
  // Get all email templates
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'emailTemplates'))
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      } as EmailTemplate))
    } catch (error: any) {
      throw new Error(`Failed to fetch email templates: ${error.message}`)
    }
  },

  // Save email template
  async saveEmailTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'emailTemplates'), {
        ...template,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error: any) {
      throw new Error(`Failed to save email template: ${error.message}`)
    }
  },

  // Get template by name
  async getTemplateByName(name: string): Promise<EmailTemplate | null> {
    try {
      const q = query(collection(db, 'emailTemplates'), where('name', '==', name))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) return null
      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      } as EmailTemplate
    } catch (error: any) {
      throw new Error(`Failed to fetch email template: ${error.message}`)
    }
  },

  // Replace template variables with actual data
  replaceTemplateVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let content = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value)
    })
    return content
  },

  // Queue email for sending
  async queueEmail(email: Omit<Email, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'emailQueue'), {
        ...email,
        status: 'pending',
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error: any) {
      throw new Error(`Failed to queue email: ${error.message}`)
    }
  },

  // Get pending emails
  async getPendingEmails(): Promise<Email[]> {
    try {
      const q = query(collection(db, 'emailQueue'), where('status', '==', 'pending'))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        sentAt: doc.data().sentAt?.toDate(),
      } as Email))
    } catch (error: any) {
      throw new Error(`Failed to fetch pending emails: ${error.message}`)
    }
  },

  // Send promotional email to customers
  async sendPromotionalEmail(
    recipientEmails: string[],
    templateName: string,
    variables: Record<string, string>
  ): Promise<void> {
    try {
      const template = await this.getTemplateByName(templateName)
      if (!template) throw new Error(`Template "${templateName}" not found`)

      const htmlContent = this.replaceTemplateVariables(template.htmlContent, variables)
      const subject = this.replaceTemplateVariables(template.subject, variables)

      await this.sendEmailBatch(recipientEmails, subject, htmlContent)
    } catch (error: any) {
      throw new Error(`Failed to send promotional email: ${error.message}`)
    }
  },

  // Send batch emails with direct content
  async sendEmailBatch(
    recipientEmails: string[],
    subject: string,
    htmlContent: string
  ): Promise<void> {
    try {
      // Queue emails for each recipient
      for (const email of recipientEmails) {
        // 1. Queue in Firestore
        const emailId = await this.queueEmail({
          to: email,
          from: 'noreply@medicinecrm.com',
          subject,
          htmlContent,
          status: 'pending',
        })

        // 2. Call API to send immediately
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: email,
              subject,
              html: htmlContent,
            }),
          })

          if (!response.ok) {
            console.error(`Failed to send email to ${email}:`, await response.text())
            // Update status to failed in Firestore (optional, requires update method)
          } else {
            // Update status to sent in Firestore (optional, requires update method)
            // For now, we assume success if API returns 200
          }
        } catch (apiError) {
          console.error(`Error calling email API for ${email}:`, apiError)
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to send batch emails: ${error.message}`)
    }
  },
}
