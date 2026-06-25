// Categories Application Layer
import { logger } from '@/core/logger/logger'
import { categoryRepository } from '../infrastructure/category-repository'

export const categoryService = {
  async getAllCategories() {
    try {
      return await categoryRepository.getAll()
    } catch (error: any) {
      logger.error('Failed to fetch categories', error)
      throw new Error(`Failed to fetch categories: ${error.message}`)
    }
  },

  async addCategory(name: string): Promise<void> {
    try {
      await categoryRepository.insert(name)
      logger.info('Category added', { name })
    } catch (error: any) {
      logger.error('Failed to add category', error, { name })
      throw new Error(`Failed to add category: ${error.message}`)
    }
  },

  async addSubcategory(categoryId: string, subcategoryName: string): Promise<void> {
    try {
      await categoryRepository.addSubcategory(categoryId, subcategoryName)
      logger.info('Subcategory added', { categoryId, subcategoryName })
    } catch (error: any) {
      logger.error('Failed to add subcategory', error, { categoryId })
      throw new Error(`Failed to add subcategory: ${error.message}`)
    }
  },
}
