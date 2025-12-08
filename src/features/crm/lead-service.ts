import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Lead } from '@/lib/models/types'

export const leadService = {
  // Create lead from contact form
  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'leads'), {
        ...leadData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error: any) {
      throw new Error(`Failed to create lead: ${error.message}`)
    }
  },

  // Update lead
  async updateLead(id: string, leadData: Partial<Lead>): Promise<void> {
    try {
      await updateDoc(doc(db, 'leads', id), {
        ...leadData,
        updatedAt: Timestamp.now(),
      })
    } catch (error: any) {
      throw new Error(`Failed to update lead: ${error.message}`)
    }
  },

  // Get all leads
  async getAllLeads(): Promise<Lead[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'leads'))
      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          stage: (data.stage || 'new') as Lead['stage'],
          priority: (data.priority || 'medium') as Lead['priority'],
          notes: data.notes || '',
          customerValue: data.customerValue as Lead['customerValue'],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Lead
      })
    } catch (error: any) {
      throw new Error(`Failed to fetch leads: ${error.message}`)
    }
  },

  // Get leads by stage
  async getLeadsByStage(stage: Lead['stage']): Promise<Lead[]> {
    try {
      const q = query(collection(db, 'leads'), where('stage', '==', stage))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          stage: (data.stage || 'new') as Lead['stage'],
          priority: (data.priority || 'medium') as Lead['priority'],
          notes: data.notes || '',
          customerValue: data.customerValue as Lead['customerValue'],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Lead
      })
    } catch (error: any) {
      throw new Error(`Failed to fetch leads by stage: ${error.message}`)
    }
  },

  // Get conversion rate
  async getConversionRate(): Promise<number> {
    try {
      const allLeads = await this.getAllLeads()
      const convertedLeads = allLeads.filter((lead) => lead.stage === 'converted')
      return allLeads.length > 0 ? (convertedLeads.length / allLeads.length) * 100 : 0
    } catch (error: any) {
      throw new Error(`Failed to calculate conversion rate: ${error.message}`)
    }
  },
}
