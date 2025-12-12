export interface User {
  id: string
  email: string
  displayName: string
  phoneNumber?: string // WhatsApp phone number in international format (+1234567890)
  role: 'admin' | 'manager' | 'customer'
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
  minStockLevel?: number // Reorder point
  maxStockLevel?: number // Maximum capacity
  reorderQuantity?: number // Auto-reorder quantity
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
  isSensitive?: boolean // Requires valid prescription
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

export interface ProductBatch {
  id: string
  batchNumber: string
  quantity: number
  manufactureDate: Date
  expiryDate: Date
  supplier: string
  costPrice: number
  receivedDate: Date
  location?: string // warehouse/shelf location
  createdAt: Date
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: 'in' | 'out' | 'adjustment' | 'expired' | 'returned' | 'damaged'
  quantity: number
  batchNumber?: string
  reason: string
  orderId?: string // if related to an order
  performedBy: string
  performedByName?: string
  previousStock: number
  newStock: number
  timestamp: Date
  notes?: string
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
  customerName?: string
  customerPhone?: string
  products: OrderItem[]
  totalAmount: number
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled' // Payment Status
  isNew?: boolean // Trigger for CRM notification
  paymentMethod?: string // Payment method from ecommerce platform
  deliveryStatus?: 'pending' | 'packing' | 'shipped' | 'delivered'
  prescriptionVerified: boolean
  dispatchTracking?: string
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  productId: string
  name: string // Product name in database
  productName?: string // Legacy field for backward compatibility
  category?: string
  quantity: number
  price: number
  image?: string | null
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

export interface Banner {
  id: string
  title: string
  image: string
  mobileImage?: string
  link: string
  seoDescription: string
  isActive: boolean
  mainCategory?: string
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
