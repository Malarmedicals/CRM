'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { seoContentRepository, type SeoContentBlock } from '@/features/seo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash, FileText, Loader2 } from 'lucide-react'

export default function SeoContentPage() {
  const [blocks, setBlocks] = useState<SeoContentBlock[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadBlocks()
  }, [])

  const loadBlocks = async () => {
    setLoading(true)
    try {
      const data = await seoContentRepository.getAll()
      setBlocks(data)
    } catch (error) {
      console.error('Failed to load SEO blocks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this SEO block?')) {
      try {
        await seoContentRepository.delete(id)
        setBlocks(blocks.filter((b) => b.id !== id))
      } catch (error) {
        console.error('Failed to delete SEO block:', error)
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO Content Blocks</h1>
          <p className="text-muted-foreground mt-1">Manage SEO text and FAQs for pages</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => router.push('/dashboard/seo-content/new')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Block
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Blocks</CardTitle>
          <CardDescription>All SEO content blocks configured for the storefront.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : blocks.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No SEO content blocks found.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/dashboard/seo-content/new')}
              >
                Create Your First Block
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page Type</TableHead>
                    <TableHead>Page Slug</TableHead>
                    <TableHead>Meta Title</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead>FAQs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.map((block) => (
                    <TableRow key={block.id}>
                      <TableCell className="font-medium capitalize">{block.page_type}</TableCell>
                      <TableCell>{block.page_slug}</TableCell>
                      <TableCell className="truncate max-w-[200px]" title={block.meta_title}>
                        {block.meta_title || '-'}
                      </TableCell>
                      <TableCell>{block.sections?.length || 0}</TableCell>
                      <TableCell>{block.faqs?.length || 0}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/seo-content/${block.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(block.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
