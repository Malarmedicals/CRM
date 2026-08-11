import { z } from 'zod'

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  seoTitle?: string | null
  metaDescription?: string | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  createdAt: Date
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  featuredImage?: string | null
  featuredImageAlt?: string | null
  authorId?: string | null
  categoryId?: string | null
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  publishedAt?: Date | null
  scheduledAt?: Date | null
  createdAt: Date
  updatedAt: Date
  readingTime?: number | null
  viewCount: number
  isFeatured: boolean
  canonicalUrl?: string | null
  seoTitle?: string | null
  metaDescription?: string | null
  focusKeyword?: string | null
  secondaryKeywords?: string | null
  
  // Relations
  category?: BlogCategory | null
  tags?: BlogTag[]
}

export interface BlogPostProduct {
  blogPostId: string
  productId: string
  sortOrder: number
}

export interface BlogPostRelatedArticle {
  blogPostId: string
  relatedPostId: string
  sortOrder: number
}
