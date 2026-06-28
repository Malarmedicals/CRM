// Products domain types (moved from @/lib/models/types.ts)
import { z } from 'zod'

export interface ProductDetail {
  id: string
  detailName: string
  detailValue: string
}

export interface ColorVariant {
  id: string
  colorName: string
  variantName: string
  originalPrice: number
  discountPrice: number
  unit?: string
}

export interface Material {
  id: string
  materialName: string
}

export interface ProductBatch {
  id: string
  batchNumber: string
  quantity: number
  manufactureDate: Date
  expiryDate: Date
  supplier: string
  costPrice: number
  receivedDate: Date
  location?: string
  createdAt: Date
}

export interface MedicalInfo {
  composition?: string
  strength?: string
  dosageForm?: string
  packSize?: string
  usageInstructions?: string
  sideEffects?: string
  storageInstructions?: string
  drugInteractions?: string
  indications?: string
  contraindications?: string
}

export interface ProductCompliance {
  scheduleType?: 'otc' | 'h' | 'h1' | 'x'
  ageRestriction?: boolean
  pharmacistApprovalRequired?: boolean
  prescriptionRequired?: boolean
}

export interface ProductShipping {
  coldChainRequired?: boolean
  extraHandlingFee?: number
  shippingZones?: string[]
}

export interface ProductSEO {
  slug?: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: 'in' | 'out' | 'adjustment' | 'expired' | 'returned' | 'damaged'
  quantity: number
  batchNumber?: string
  reason: string
  orderId?: string
  performedBy: string
  performedByName?: string
  previousStock: number
  newStock: number
  timestamp: Date
  notes?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  discount: number
  category: string
  subcategory: string
  batchNumber: string
  expiryDate: Date
  stockQuantity: number
  minStockLevel?: number
  maxStockLevel?: number
  reorderQuantity?: number
  images: string[]
  primaryImage?: string
  additionalImages?: string[]
  productDetails?: ProductDetail[]
  colorVariants?: ColorVariant[]
  materials?: Material[]
  seoTags?: string
  hsnCode?: string
  gstRate?: number
  vendor?: string
  brandName?: string
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock'
  estimatedDelivery?: string
  freeShippingThreshold?: number
  batches?: ProductBatch[]
  lastRestocked?: Date
  averageMonthlySales?: number
  createdAt: Date
  updatedAt: Date
  sku?: string
  mrp?: number
  sellingPrice?: number
  discountType?: 'flat' | 'percentage'
  taxType?: 'inclusive' | 'exclusive'
  lowStockThreshold?: number
  medicalInfo?: MedicalInfo
  compliance?: ProductCompliance
  shipping?: ProductShipping
  seo?: ProductSEO
  createdBy?: string
  updatedBy?: string
  isRecalled?: boolean
  isSensitive?: boolean
  healthConcern?: string
  status?: 'draft' | 'published'
}

// Validation schemas
export const addProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  category: z.string().optional(),
  stockQuantity: z.number().min(0).optional(),
})

export type AddProductInput = z.infer<typeof addProductSchema>
