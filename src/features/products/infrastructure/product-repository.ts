// Products Infrastructure Layer: All direct Supabase data access.
import { supabase } from '@/lib/supabase/client'
import type { Product, StockMovement } from '../domain/types'

const PRODUCTS_TABLE = 'products'
const STOCK_MOVEMENTS_TABLE = 'stock_movements'

// ─── Data mapping ──────────────────────────────────────────────────────────────
const safeDate = (date: any): Date => (date ? new Date(date) : new Date())

export function mapDbRowToProduct(doc: any): Product {
  return {
    id: doc.id,
    name: doc.name || '',
    description: doc.description || '',
    price: doc.price || 0,
    mrp: doc.mrp || 0,
    discount: doc.discount || 0,
    category: doc.category || '',
    subcategory: doc.subcategory || '',
    batchNumber: doc.batch_number || '',
    expiryDate: safeDate(doc.expiry_date),
    stockQuantity: doc.stock_quantity || 0,
    images: doc.images || [],
    primaryImage: doc.image_url,
    additionalImages: doc.additional_images || [],
    brandName: doc.brand,
    lastRestocked: doc.last_restocked ? new Date(doc.last_restocked) : undefined,
    minStockLevel: doc.min_stock_level,
    stockStatus: doc.stock_status || 'in-stock',
    medicalInfo: doc.medical_info || {},
    compliance: doc.compliance || {},
    shipping: doc.shipping || {},
    seo: doc.seo || {},
    createdAt: safeDate(doc.created_at),
    updatedAt: safeDate(doc.updated_at),
    status: doc.is_active ? 'published' : 'draft',
    gstRate: doc.gst_rate,
    hsnCode: doc.hsn_code,
  } as Product
}

export function mapDbRowToStockMovement(doc: any): StockMovement {
  return {
    id: doc.id,
    productId: doc.product_id,
    productName: doc.product_name,
    type: doc.type,
    quantity: doc.quantity,
    reason: doc.reason,
    performedBy: doc.performed_by,
    performedByName: doc.performed_by_name,
    previousStock: doc.previous_stock,
    newStock: doc.new_stock,
    timestamp: new Date(doc.created_at || Date.now()),
    notes: doc.notes,
  }
}

// ─── Repository ────────────────────────────────────────────────────────────────
export const productRepository = {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase.from(PRODUCTS_TABLE).select('*')
    if (error) throw error
    return data.map(mapDbRowToProduct)
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase.from(PRODUCTS_TABLE).select('*').eq('id', id).single()
    if (error || !data) return null
    return mapDbRowToProduct(data)
  },

  async search(searchTerm: string): Promise<Product[]> {
    if (!searchTerm) return []
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*')
      .ilike('name', `${searchTerm}%`)
      .limit(20)
    if (error) throw error
    return data.map(mapDbRowToProduct)
  },

  async getByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase.from(PRODUCTS_TABLE).select('*').eq('category', category)
    if (error) throw error
    return data.map(mapDbRowToProduct)
  },

  async getLowStock(threshold: number): Promise<Product[]> {
    const { data, error } = await supabase.from(PRODUCTS_TABLE).select('*').lt('stock_quantity', threshold)
    if (error) throw error
    return data.map(mapDbRowToProduct)
  },

  async getCount(): Promise<number> {
    const { count, error } = await supabase.from(PRODUCTS_TABLE).select('*', { count: 'exact', head: true })
    if (error) throw error
    return count || 0
  },

  async getExistingIdentifiers(): Promise<{ name: string, batchNumber: string }[]> {
    const { data, error } = await supabase.from(PRODUCTS_TABLE).select('name, batch_number')
    if (error) throw error
    return data.map((d: any) => ({ name: d.name, batchNumber: d.batch_number }))
  },

  async getUniqueCategories(): Promise<{ categories: string[], subcategories: string[] }> {
    const { data, error } = await supabase.from(PRODUCTS_TABLE).select('category, subcategory')
    if (error) throw error
    const cats = new Set<string>()
    const subcats = new Set<string>()
    data.forEach((d: any) => {
      if (d.category) cats.add(d.category)
      if (d.subcategory) subcats.add(d.subcategory)
    })
    return { categories: Array.from(cats), subcategories: Array.from(subcats) }
  },

  async insert(productData: any): Promise<string> {
    const insertPayload: any = {
      name: productData.name,
      description: productData.description,
      price: productData.price || 0,
      mrp: productData.mrp || 0,
      discount: productData.discount || 0,
      category: productData.category,
      subcategory: productData.subcategory,
      brand: productData.brandName,
      stock_quantity: productData.stockQuantity || 0,
      image_url: productData.primaryImage,
      additional_images: productData.additionalImages || [],
      batch_number: productData.batchNumber,
      expiry_date: productData.expiryDate,
      min_stock_level: productData.minStockLevel || 10,
      stock_status: productData.stockStatus || 'in-stock',
      seo: productData.seo,
      compliance: productData.compliance,
      shipping: productData.shipping,
      medical_info: productData.medicalInfo,
      gst_rate: productData.gstRate,
      hsn_code: productData.hsnCode,
      is_active: productData.status === 'published' || productData.status === undefined,
    };

    const { data, error } = await supabase.from(PRODUCTS_TABLE).insert(insertPayload).select().single()
    if (error) throw error
    return data.id
  },

  async insertMany(productsData: any[]): Promise<void> {
    if (productsData.length > 500) {
      throw new Error("Cannot insert more than 500 products at once.")
    }
    const payloads = productsData.map(productData => ({
      name: productData.name,
      description: productData.description,
      price: productData.price || 0,
      mrp: productData.mrp || 0,
      discount: productData.discount || 0,
      category: productData.category,
      subcategory: productData.subcategory,
      brand: productData.brandName,
      stock_quantity: productData.stockQuantity || 0,
      image_url: productData.primaryImage,
      additional_images: productData.additionalImages || [],
      batch_number: productData.batchNumber,
      expiry_date: productData.expiryDate,
      min_stock_level: productData.minStockLevel || 10,
      stock_status: productData.stockStatus || 'in-stock',
      seo: productData.seo,
      compliance: productData.compliance,
      shipping: productData.shipping,
      medical_info: productData.medicalInfo,
      gst_rate: productData.gstRate,
      hsn_code: productData.hsnCode,
      is_active: productData.status === 'published' || productData.status === undefined,
    }));

    // Insert all at once to ensure a single transaction (all-or-nothing for the batch)
    const { error } = await supabase.from(PRODUCTS_TABLE).insert(payloads);
    if (error) throw error;
  },

  async update(id: string, productData: any): Promise<void> {
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };

    if (productData.name !== undefined) updatePayload.name = productData.name;
    if (productData.description !== undefined) updatePayload.description = productData.description;
    if (productData.price !== undefined) updatePayload.price = productData.price;
    if (productData.mrp !== undefined) updatePayload.mrp = productData.mrp;
    if (productData.discount !== undefined) updatePayload.discount = productData.discount;
    if (productData.category !== undefined) updatePayload.category = productData.category;
    if (productData.subcategory !== undefined) updatePayload.subcategory = productData.subcategory;
    if (productData.brandName !== undefined) updatePayload.brand = productData.brandName;
    if (productData.stockQuantity !== undefined) updatePayload.stock_quantity = productData.stockQuantity;
    if (productData.primaryImage !== undefined) updatePayload.image_url = productData.primaryImage;
    if (productData.additionalImages !== undefined) updatePayload.additional_images = productData.additionalImages;
    if (productData.batchNumber !== undefined) updatePayload.batch_number = productData.batchNumber;
    if (productData.expiryDate !== undefined) updatePayload.expiry_date = productData.expiryDate;
    if (productData.minStockLevel !== undefined) updatePayload.min_stock_level = productData.minStockLevel;
    if (productData.seo !== undefined) updatePayload.seo = productData.seo;
    if (productData.compliance !== undefined) updatePayload.compliance = productData.compliance;
    if (productData.shipping !== undefined) updatePayload.shipping = productData.shipping;
    if (productData.medicalInfo !== undefined) updatePayload.medical_info = productData.medicalInfo;
    if (productData.stockStatus !== undefined) updatePayload.stock_status = productData.stockStatus;
    if (productData.gstRate !== undefined) updatePayload.gst_rate = productData.gstRate;
    if (productData.hsnCode !== undefined) updatePayload.hsn_code = productData.hsnCode;
    
    if (productData.status) {
      updatePayload.is_active = productData.status === 'published';
    } else if (productData.is_active !== undefined) {
      updatePayload.is_active = productData.is_active;
    }

    const { error } = await supabase
      .from(PRODUCTS_TABLE)
      .update(updatePayload)
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(PRODUCTS_TABLE).delete().eq('id', id)
    if (error) throw error
  },

  async updateStock(productId: string, newStock: number, lastRestocked?: boolean): Promise<void> {
    const updateData: any = { stock_quantity: newStock, updated_at: new Date().toISOString() }
    if (lastRestocked) updateData.last_restocked = new Date().toISOString()
    const { error } = await supabase.from(PRODUCTS_TABLE).update(updateData).eq('id', productId)
    if (error) throw error
  },

  async getRawById(id: string): Promise<any | null> {
    const { data, error } = await supabase.from(PRODUCTS_TABLE).select('*').eq('id', id).single()
    if (error || !data) return null
    return data
  },
}

export const stockMovementRepository = {
  async insert(movement: {
    product_id: string
    product_name: string
    type: string
    quantity: number
    reason: string
    performed_by: string
    performed_by_name: string | undefined
    previous_stock: number
    new_stock: number
    notes: string
  }): Promise<void> {
    const { error } = await supabase.from(STOCK_MOVEMENTS_TABLE).insert(movement)
    if (error) throw error
  },

  async getAll(productId?: string, limitCount = 50): Promise<StockMovement[]> {
    let query = supabase
      .from(STOCK_MOVEMENTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount)
    if (productId) query = query.eq('product_id', productId)
    const { data, error } = await query
    if (error) throw error
    return data.map(mapDbRowToStockMovement)
  },
}
