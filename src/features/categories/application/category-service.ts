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

  async deleteCategory(id: string): Promise<void> {
    try {
      await categoryRepository.delete(id)
      logger.info('Category deleted', { id })
    } catch (error: any) {
      logger.error('Failed to delete category', error, { id })
      throw new Error(`Failed to delete category: ${error.message}`)
    }
  },

  async updateCategory(id: string, name: string): Promise<void> {
    try {
      await categoryRepository.update(id, name)
      logger.info('Category updated', { id, name })
    } catch (error: any) {
      logger.error('Failed to update category', error, { id, name })
      throw new Error(`Failed to update category: ${error.message}`)
    }
  },

  async removeSubcategory(categoryId: string, subcategoryName: string): Promise<void> {
    try {
      await categoryRepository.removeSubcategory(categoryId, subcategoryName)
      logger.info('Subcategory removed', { categoryId, subcategoryName })
    } catch (error: any) {
      logger.error('Failed to remove subcategory', error, { categoryId, subcategoryName })
      throw new Error(`Failed to remove subcategory: ${error.message}`)
    }
  },

  async updateSubcategory(categoryId: string, oldName: string, newName: string): Promise<void> {
    try {
      await categoryRepository.updateSubcategory(categoryId, oldName, newName)
      logger.info('Subcategory updated', { categoryId, oldName, newName })
    } catch (error: any) {
      logger.error('Failed to update subcategory', error, { categoryId, oldName, newName })
      throw new Error(`Failed to update subcategory: ${error.message}`)
    }
  },
}
