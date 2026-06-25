// Public API barrel for the products feature.
export { productService, inventoryService } from './application/product-service'
export type { Product, StockMovement, ProductBatch, MedicalInfo, AddProductInput } from './domain/types'
export { addProductSchema } from './domain/types'
