// Products Application Layer: Business logic for products and inventory.
// All orchestration happens here; no direct Supabase calls.
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/core/logger/logger'
import { NotFoundError, UnauthorizedError } from '@/core/errors/AppError'
import { productRepository, stockMovementRepository } from '../infrastructure/product-repository'
import type { Product, StockMovement } from '../domain/types'

export const productService = {
  async getExistingIdentifiers(): Promise<{ name: string, batchNumber: string }[]> {
    return await productRepository.getExistingIdentifiers();
  },

  async getUniqueCategories(): Promise<{ categories: string[], subcategories: string[] }> {
    return await productRepository.getUniqueCategories();
  },

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

  async addManyProducts(productsData: any[]): Promise<void> {
    try {
      await productRepository.insertMany(productsData)
      logger.info(`Successfully added ${productsData.length} products`)
    } catch (error: any) {
      logger.error('Failed to add multiple products', error)
      throw new Error(`Failed to add products: ${error.message}`)
    }
  },

  async importProductsWithImages(productsData: any[], imageFilesMap: Map<string, File>): Promise<void> {
    // 1. Authoritative Validation
    if (productsData.length > 500) {
      throw new Error("Batch size exceeds 500 rows limit.");
    }
    const identifiers = await productRepository.getExistingIdentifiers();
    const existingNames = new Set(identifiers.map(i => i.name.toLowerCase()));
    const existingBatches = new Set(identifiers.map(i => i.batchNumber.toLowerCase()));
    const { categories, subcategories } = await productRepository.getUniqueCategories();
    const validCats = new Set(categories.map(c => c.toLowerCase()));
    const validSubcats = new Set(subcategories.map(c => c.toLowerCase()));
    const validSchedules = new Set(['otc', 'h', 'h1', 'x']);

    const batchNames = new Set();
    const batchBatches = new Set();

    for (const product of productsData) {
      // In-file duplicate check
      const lowerName = product.name?.toLowerCase();
      const lowerBatch = product.batchNumber?.toLowerCase();

      if (batchNames.has(lowerName)) throw new Error(`Duplicate Product Name in file: ${product.name}`);
      if (batchBatches.has(lowerBatch)) throw new Error(`Duplicate Batch Number in file: ${product.batchNumber}`);
      batchNames.add(lowerName);
      batchBatches.add(lowerBatch);

      // DB duplicate check
      if (existingNames.has(lowerName)) throw new Error(`Product Name already exists in database: ${product.name}`);
      if (existingBatches.has(lowerBatch)) throw new Error(`Batch Number already exists in database: ${product.batchNumber}`);

      // MRP >= Selling Price check
      if (product.mrp < (product.discount || 0)) {
        throw new Error(`MRP (${product.mrp}) cannot be less than Selling Price (${product.discount}) for ${product.name}`);
      }

      // Expiry Date > Today
      if (product.expiryDate && new Date(product.expiryDate) <= new Date()) {
        throw new Error(`Expiry Date must be in the future for ${product.name}`);
      }

      // Enums Validation
      if (!validCats.has(product.category?.toLowerCase())) throw new Error(`Invalid Category: ${product.category}`);
      if (product.subcategory && !validSubcats.has(product.subcategory?.toLowerCase())) {
         // Some products might have new subcategories or none, but strict enum validation requested
         throw new Error(`Invalid Subcategory: ${product.subcategory}`);
      }
      if (product.compliance?.scheduleType && !validSchedules.has(product.compliance.scheduleType.toLowerCase())) {
         throw new Error(`Invalid Schedule Type: ${product.compliance.scheduleType}`);
      }
    }

    // 2. Upload Images
    const uploadedPaths: string[] = [];
    const uploadedUrls = new Map<string, string>(); // image filename -> public URL

    try {
      // Upload all needed images
      for (const [filename, file] of imageFilesMap.entries()) {
        const refName = `products/bulk_${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data, error } = await supabase.storage.from('products').upload(refName, file);
        if (error) throw error;
        
        uploadedPaths.push(data.path);
        const publicUrl = supabase.storage.from('products').getPublicUrl(data.path).data.publicUrl;
        uploadedUrls.set(filename, publicUrl);
      }

      // 3. Assign image URLs to products
      const finalProducts = productsData.map(p => {
        const mainImgUrl = p._mainImageFilename ? uploadedUrls.get(p._mainImageFilename) : p.primaryImage;
        const additionalUrls = (p._additionalImageFilenames || []).map((name: string) => uploadedUrls.get(name)).filter(Boolean);
        return {
          ...p,
          primaryImage: mainImgUrl,
          images: additionalUrls
        };
      });

      // 4. All-or-nothing DB Insert
      await productRepository.insertMany(finalProducts);
      logger.info(`Successfully imported ${productsData.length} products with images`);

    } catch (error: any) {
      logger.error('Import transaction failed, rolling back images', error);
      // Explicit cleanup on failure
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('products').remove(uploadedPaths);
        logger.info(`Rolled back ${uploadedPaths.length} uploaded images`);
      }
      throw new Error(`Import Failed: ${error.message}`);
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
