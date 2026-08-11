import { supabase } from '@/lib/supabase/client'
import type { BlogPost, BlogCategory } from '../domain/types'

const POSTS_TABLE = 'blog_posts'
const CATEGORIES_TABLE = 'blog_categories'

function mapDbRowToBlogPost(doc: any): BlogPost {
  return {
    ...doc,
    categoryId: doc.categoryId,
    featuredImage: doc.featuredImage,
    featuredImageAlt: doc.featuredImageAlt,
    authorId: doc.authorId,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
    scheduledAt: doc.scheduledAt ? new Date(doc.scheduledAt) : null,
    createdAt: new Date(doc.createdAt || Date.now()),
    updatedAt: new Date(doc.updatedAt || Date.now()),
    readingTime: doc.readingTime,
    viewCount: doc.viewCount || 0,
    isFeatured: doc.isFeatured || false,
    canonicalUrl: doc.canonicalUrl,
    seoTitle: doc.seoTitle,
    metaDescription: doc.metaDescription,
    focusKeyword: doc.focusKeyword,
    secondaryKeywords: doc.secondaryKeywords,
    // if category is joined
    category: doc.blog_categories ? mapDbRowToCategory(doc.blog_categories) : undefined
  }
}

function mapDbRowToCategory(doc: any): BlogCategory {
  return {
    ...doc,
    seoTitle: doc.seoTitle,
    metaDescription: doc.metaDescription,
    isActive: doc.isActive ?? true,
    sortOrder: doc.sortOrder ?? 0,
    createdAt: new Date(doc.createdAt || Date.now()),
    updatedAt: new Date(doc.updatedAt || Date.now()),
  }
}

export const blogRepository = {
  // POSTS
  async getAllPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from(POSTS_TABLE)
      .select('*, blog_categories(*)')
      .order('createdAt', { ascending: false })
    if (error) throw error
    return data.map(mapDbRowToBlogPost)
  },

  async getPostById(id: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from(POSTS_TABLE)
      .select('*, blog_categories(*)')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return mapDbRowToBlogPost(data)
  },

  async insertPost(postData: any): Promise<string> {
    const { data, error } = await supabase.from(POSTS_TABLE).insert(postData).select().single()
    if (error) throw error
    return data.id
  },

  async updatePost(id: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from(POSTS_TABLE)
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase.from(POSTS_TABLE).delete().eq('id', id)
    if (error) throw error
  },

  // CATEGORIES
  async getAllCategories(): Promise<BlogCategory[]> {
    const { data, error } = await supabase
      .from(CATEGORIES_TABLE)
      .select('*')
      .order('sortOrder', { ascending: true })
    if (error) throw error
    return data.map(mapDbRowToCategory)
  },
  
  async insertCategory(categoryData: any): Promise<string> {
    const { data, error } = await supabase.from(CATEGORIES_TABLE).insert(categoryData).select().single()
    if (error) throw error
    return data.id
  },
  
  async updateCategory(id: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from(CATEGORIES_TABLE)
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }
}
