export interface User {
  id: string
  email: string
  displayName: string
  phoneNumber?: string // WhatsApp phone number in international format (+1234567890)
  role: 'admin' | 'manager' | 'user' | 'customer'
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
  updatedAt: Date
}

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

export interface Category {
  id: string
  name: string
  slug: string
  medicineCount: number
  parent?: string
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  userId: string
  products: OrderItem[]
  totalAmount: number
  status: 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled'
  prescriptionVerified: boolean
  dispatchTracking?: string
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
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
