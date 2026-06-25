// Prescriptions Application Layer
import { logger } from '@/core/logger/logger'
import { prescriptionRepository } from '../infrastructure/prescription-repository'

export const prescriptionService = {
  async addPrescription(data: any): Promise<void> {
    try {
      await prescriptionRepository.insert(data)
      logger.info('Prescription added')
    } catch (error: any) {
      logger.error('Failed to add prescription', error)
      throw new Error(`Failed to add prescription: ${error.message}`)
    }
  },

  async getPrescriptions() {
    try {
      return await prescriptionRepository.getAll()
    } catch (error: any) {
      logger.error('Failed to fetch prescriptions', error)
      throw new Error(`Failed to fetch prescriptions: ${error.message}`)
    }
  },

  async getPrescriptionById(id: string) {
    try {
      return await prescriptionRepository.getById(id)
    } catch (error: any) {
      logger.error('Failed to fetch prescription by ID', error, { id })
      throw new Error(`Failed to fetch prescription by ID: ${error.message}`)
    }
  },

  async updatePrescriptionStatus(id: string, status: string, notes?: string): Promise<void> {
    try {
      await prescriptionRepository.updateStatus(id, status, notes)
      logger.info('Prescription status updated', { id, status })
    } catch (error: any) {
      logger.error('Failed to update prescription status', error, { id, status })
      throw new Error(`Failed to update prescription status: ${error.message}`)
    }
  },

  async deletePrescription(id: string): Promise<void> {
    try {
      await prescriptionRepository.delete(id)
      logger.info('Prescription deleted', { id })
    } catch (error: any) {
      logger.error('Failed to delete prescription', error, { id })
      throw new Error(`Failed to delete prescription: ${error.message}`)
    }
  },
}
