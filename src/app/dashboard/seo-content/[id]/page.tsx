'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { seoContentRepository, type SeoContentBlock, SeoContentForm } from '@/features/seo'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function EditSeoContentPage() {
  const [block, setBlock] = useState<SeoContentBlock | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    if (id) {
      loadBlock(id)
    }
  }, [id])

  const loadBlock = async (blockId: string) => {
    try {
      const data = await seoContentRepository.getById(blockId)
      if (data) {
        setBlock(data)
      } else {
        router.push('/dashboard/seo-content')
      }
    } catch (error) {
      console.error('Failed to load SEO block:', error)
      router.push('/dashboard/seo-content')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!block) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-8 text-center text-muted-foreground">
          Block not found
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <SeoContentForm initialData={block} />
    </div>
  )
}
