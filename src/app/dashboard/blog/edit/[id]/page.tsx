'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BlogEditor } from '@/features/blog/components/blog-editor'
import { blogRepository } from '@/features/blog/infrastructure/blog-repository'
import type { BlogPost } from '@/features/blog/domain/types'

export default function EditBlogPage() {
  const params = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPost = async () => {
      if (params.id) {
        try {
          const fetchedPost = await blogRepository.getPostById(params.id as string)
          setPost(fetchedPost)
        } catch (error) {
          console.error('Failed to fetch post', error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchPost()
  }, [params.id])

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading article...</div>
  }

  if (!post) {
    return <div className="p-10 text-center text-red-500">Article not found</div>
  }

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto animate-fade-in">
      <BlogEditor initialData={post} />
    </div>
  )
}
