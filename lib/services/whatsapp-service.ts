import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'

export interface WhatsAppMessage {
  id?: string
  to: string
  message: string
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  sentAt?: Date
  failureReason?: string
  createdAt?: Date
}

export interface WhatsAppTemplate {
  id?: string
  name: string
  message: string
  variables: string[] // e.g., {{customerName}}, {{orderNumber}}
  description?: string
  createdAt?: Date
}

export const whatsappService = {
  // Get all WhatsApp templates
  async getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'whatsappTemplates'))
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      } as WhatsAppTemplate))
    } catch (error: any) {
      throw new Error(`Failed to fetch WhatsApp templates: ${error.message}`)
    }
  },

  // Save WhatsApp template
  async saveWhatsAppTemplate(template: Omit<WhatsAppTemplate, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'whatsappTemplates'), {
        ...template,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error: any) {
      throw new Error(`Failed to save WhatsApp template: ${error.message}`)
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

  // Queue WhatsApp message
  async queueMessage(message: Omit<WhatsAppMessage, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'whatsappQueue'), {
        ...message,
        status: 'pending',
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error: any) {
      throw new Error(`Failed to queue WhatsApp message: ${error.message}`)
    }
  },

  // Get pending messages
  async getPendingMessages(): Promise<WhatsAppMessage[]> {
    try {
      const q = query(collection(db, 'whatsappQueue'), where('status', '==', 'pending'))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        sentAt: doc.data().sentAt?.toDate(),
      } as WhatsAppMessage))
    } catch (error: any) {
      throw new Error(`Failed to fetch pending WhatsApp messages: ${error.message}`)
    }
  },

  // Send WhatsApp message to single recipient
  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    try {
      // Get the base URL - works in both client and server contexts
      const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
          return window.location.origin
        }
        if (process.env.NEXT_PUBLIC_BASE_URL) {
          return process.env.NEXT_PUBLIC_BASE_URL
        }
        if (process.env.VERCEL_URL) {
          return `https://${process.env.VERCEL_URL}`
        }
        return 'http://localhost:3000'
      }

      const baseUrl = getBaseUrl()
      const apiUrl = `${baseUrl}/api/send-whatsapp`

      // Queue message in Firestore
      await this.queueMessage({
        to: phoneNumber,
        message,
        status: 'pending',
      })

      // Call API to send immediately
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message,
        }),
      })

      if (!response.ok) {
        let errorText: string
        let errorData: any

        try {
          errorData = await response.json()
          errorText = errorData.details || errorData.error || JSON.stringify(errorData)
        } catch {
          errorText = await response.text()
        }

        console.error(`Failed to send WhatsApp to ${phoneNumber}:`, errorText)
        throw new Error(`WhatsApp API returned ${response.status}: ${errorText}`)
      } else {
        const result = await response.json()
        if (result.simulated) {
          console.warn(`WhatsApp simulated (credentials missing) for ${phoneNumber}. Check server console for details.`)
        } else {
          console.log(`WhatsApp sent successfully to ${phoneNumber}`, result)
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to send WhatsApp message: ${error.message}`)
    }
  },

  // Send batch WhatsApp messages
  async sendBatchMessages(
    phoneNumbers: string[],
    message: string
  ): Promise<void> {
    try {
      for (const phoneNumber of phoneNumbers) {
        await this.sendMessage(phoneNumber, message)
      }
    } catch (error: any) {
      throw new Error(`Failed to send batch WhatsApp messages: ${error.message}`)
    }
  },

  // Send promotional message to customer segment
  async sendSegmentedMessage(
    segment: 'regular' | 'prescription' | 'highValue' | 'all',
    message: string,
    variables?: Record<string, string>
  ): Promise<void> {
    try {
      // Import here to avoid circular dependency
      const { notificationService } = await import('./notification-service')
      const { userService } = await import('./user-service')
      
      const segments = await notificationService.segmentCustomers()
      
      let recipientEmails: string[] = []

      if (segment === 'all') {
        const allEmails = new Set([
          ...segments.regular,
          ...segments.prescription,
          ...segments.highValue
        ])
        recipientEmails = Array.from(allEmails)
      } else {
        recipientEmails = segments[segment]
      }

      if (recipientEmails.length === 0) {
        console.warn(`No customers found in ${segment} segment.`)
        return
      }

      // Get all users to map emails to phone numbers
      const allUsers = await userService.getAllUsers()
      
      // Create email to phone number mapping
      const emailToPhoneMap = new Map<string, string>()
      allUsers.forEach(user => {
        if (user.email && user.phoneNumber) {
          emailToPhoneMap.set(user.email.toLowerCase(), user.phoneNumber)
        }
      })

      // Filter recipients to only those with phone numbers
      const phoneNumbers: string[] = []
      const skippedEmails: string[] = []
      const invalidPhones: string[] = []

      // Phone number validation regex (international format)
      // Supports India format: +91XXXXXXXXXX (10 digits after +91)
      // Also supports other international formats
      const phoneRegex = /^\+?[1-9]\d{9,14}$/

      recipientEmails.forEach(email => {
        const phoneNumber = emailToPhoneMap.get(email.toLowerCase())
        if (phoneNumber) {
          // Clean and validate phone number
          const cleanPhone = phoneNumber.replace(/\s|-|\(|\)/g, '')
          const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`
          
          if (phoneRegex.test(formattedPhone)) {
            phoneNumbers.push(formattedPhone)
          } else {
            invalidPhones.push(`${email} (${phoneNumber})`)
          }
        } else {
          skippedEmails.push(email)
        }
      })

      if (phoneNumbers.length === 0) {
        let errorMsg = `No valid phone numbers found for customers in ${segment} segment.`
        if (skippedEmails.length > 0) {
          errorMsg += ` ${skippedEmails.length} customer(s) don't have phone numbers.`
        }
        if (invalidPhones.length > 0) {
          errorMsg += ` ${invalidPhones.length} customer(s) have invalid phone numbers.`
        }
        errorMsg += ' Please add valid phone numbers (international format: +1234567890) to user profiles in the Users section.'
        console.warn(errorMsg)
        if (skippedEmails.length > 0) console.warn('Skipped emails (no phone):', skippedEmails)
        if (invalidPhones.length > 0) console.warn('Invalid phone numbers:', invalidPhones)
        throw new Error(errorMsg)
      }

      // Send messages to users with valid phone numbers
      if (skippedEmails.length > 0 || invalidPhones.length > 0) {
        const totalSkipped = skippedEmails.length + invalidPhones.length
        console.warn(`⚠️ Sending to ${phoneNumbers.length} recipients, skipping ${totalSkipped} without valid phone numbers`)
        if (skippedEmails.length > 0) console.warn('  - No phone number:', skippedEmails)
        if (invalidPhones.length > 0) console.warn('  - Invalid phone number:', invalidPhones)
      }

      // Replace variables in message
      const finalMessage = variables 
        ? this.replaceTemplateVariables(message, variables)
        : message

      console.log(`📱 Sending WhatsApp to ${phoneNumbers.length} recipients in ${segment} segment (${skippedEmails.length} skipped)`)

      await this.sendBatchMessages(phoneNumbers, finalMessage)
    } catch (error: any) {
      throw new Error(`Failed to send segmented WhatsApp: ${error.message}`)
    }
  },
}

