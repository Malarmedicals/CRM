import { z } from 'zod'

export interface PrescriptionItem {
  medicineName: string
  productId?: string
  productName?: string
  quantity: number
  price?: number
  dosage: string
  duration?: string
  isSubstitute?: boolean
}

export interface Prescription {
  id: string
  userId: string
  customerName?: string
  customerPhone?: string
  fileUrl: string
  fileType: string
  status: 'pending' | 'verifying' | 'approved' | 'rejected' | 'ordered'
  pharmacistId?: string
  pharmacistName?: string
  verificationNotes?: string
  rejectionReason?: string
  prescribedMedicines?: PrescriptionItem[]
  doctorName?: string
  patientName?: string
  prescriptionDate?: Date
  medicationNotes?: {
    customerNotes?: string
    calculationMode?: string
    [key: string]: any
  }
  orderId?: string
  createdAt: Date
  updatedAt: Date
}
