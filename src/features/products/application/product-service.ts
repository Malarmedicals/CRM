// Products Application Layer: Business logic for products and inventory.
// All orchestration happens here; no direct Supabase calls.
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/core/logger/logger'
import { NotFoundError, UnauthorizedError } from '@/core/errors/AppError'
import { productRepository, stockMovementRepository } from '../infrastructure/product-repository'
import type { Product, StockMovement } from '../domain/types'

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      return await productRepository.getAll()
    } catch (error: any) {
      logger.error('Failed to fetch all products', error)
      throw new Error(`Failed to fetch products: ${error.message}`)
    }
  },

  async searchProducts(searchTerm: string): Promise<Product[]> {
    try {
      return await productRepository.search(searchTerm)
    } catch (error: any) {
      logger.error('Failed to search products', error, { searchTerm })
      return []
    }
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      return await productRepository.getByCategory(category)
    } catch (error: any) {
      logger.error('Failed to fetch products by category', error, { category })
      throw new Error(`Failed to fetch products by category: ${error.message}`)
    }
  },

  async getLowStockProducts(threshold = 10): Promise<Product[]> {
    try {
      return await productRepository.getLowStock(threshold)
    } catch (error: any) {
      logger.error('Failed to fetch low stock products', error)
      throw new Error(`Failed to fetch low stock products: ${error.message}`)
    }
  },

  async getProductCount(): Promise<number> {
    try {
      return await productRepository.getCount()
    } catch {
      return 0
    }
  },

  async addProduct(productData: any): Promise<string> {
    try {
      const id = await productRepository.insert(productData)
      logger.info('Product added', { productId: id, name: productData.name })
      return id
    } catch (error: any) {
      logger.error('Failed to add product', error, { name: productData.name })
      throw new Error(`Failed to add product: ${error.message}`)
    }
  },

  async updateProduct(id: string, productData: any): Promise<void> {
    try {
      await productRepository.update(id, productData)
      logger.info('Product updated', { productId: id })
    } catch (error: any) {
      logger.error('Failed to update product', error, { productId: id })
      throw new Error(`Failed to update product: ${error.message}`)
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await productRepository.delete(id)
      logger.info('Product deleted', { productId: id })
    } catch (error: any) {
      logger.error('Failed to delete product', error, { productId: id })
      throw new Error(`Failed to delete product: ${error.message}`)
    }
  },

  async getExpiringProducts(daysThreshold = 30): Promise<Product[]> {
    try {
      const products = await productRepository.getAll()
      const thresholdDate = new Date()
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)
      const now = new Date()

      return products
        .filter((p) => p.expiryDate && new Date(p.expiryDate) <= thresholdDate && new Date(p.expiryDate) >= now)
        .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
    } catch (error: any) {
      logger.error('Failed to get expiring products', error)
      return []
    }
  },
}

export const inventoryService = {
  async getAllProducts(): Promise<Product[]> {
    return productService.getAllProducts()
  },

  async getLowStockProducts(): Promise<Product[]> {
    const products = await productRepository.getAll()
    return products.filter((p) => {
      const min = p.minStockLevel || 10
      return p.stockQuantity <= min && p.stockQuantity > 0
    })
  },

  async getOutOfStockProducts(): Promise<Product[]> {
    const products = await productRepository.getAll()
    return products.filter((p) => p.stockQuantity === 0)
  },

  async getExpiringProducts(daysThreshold = 30): Promise<Product[]> {
    return productService.getExpiringProducts(daysThreshold)
  },

  async updateStock(
    productId: string,
    quantity: number,
    type: StockMovement['type'],
    reason: string,
    notes?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new UnauthorizedError('User not authenticated')

    const productRaw = await productRepository.getRawById(productId)
    if (!productRaw) throw new NotFoundError('Product not found')

    const previousStock = productRaw.stock_quantity || 0
    let newStock = previousStock

    if (type === 'in') {
      newStock = previousStock + quantity
    } else if (type === 'out' || type === 'expired' || type === 'damaged') {
      newStock = Math.max(0, previousStock - quantity)
    } else if (type === 'adjustment') {
      newStock = quantity
    }

    await productRepository.updateStock(productId, newStock, type === 'in')
    await stockMovementRepository.insert({
      product_id: productId,
      product_name: productRaw.name,
      type,
      quantity,
      reason,
      performed_by: user.id,
      performed_by_name: user.email,
      previous_stock: previousStock,
      new_stock: newStock,
      notes: notes || '',
    })

    logger.info('Stock updated', { productId, type, quantity, newStock })
  },

  async getStockMovements(productId?: string, limitCount = 50): Promise<StockMovement[]> {
    return stockMovementRepository.getAll(productId, limitCount)
  },

  async getInventoryStats() {
    const [products, lowStock, outOfStock, expiringSoon] = await Promise.all([
      productRepository.getAll(),
      this.getLowStockProducts(),
      this.getOutOfStockProducts(),
      this.getExpiringProducts(30),
    ])

    const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stockQuantity || 0), 0)
    const totalItems = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0)

    return {
      totalProducts: products.length,
      totalItems,
      totalValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      expiringSoonCount: expiringSoon.length,
    }
  },
}
