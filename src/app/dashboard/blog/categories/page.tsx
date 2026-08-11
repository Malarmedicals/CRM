'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash, ArrowLeft } from 'lucide-react'
import { blogRepository } from '@/features/blog/infrastructure/blog-repository'
import type { BlogCategory } from '@/features/blog/domain/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function BlogCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null)
  
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const fetched = await blogRepository.getAllCategories()
      setCategories(fetched)
    } catch (error) {
      console.error('Failed to load categories', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (cat?: BlogCategory) => {
    if (cat) {
      setEditingCategory(cat)
      setFormData({ name: cat.name, slug: cat.slug, description: cat.description || '' })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', slug: '', description: '' })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await blogRepository.updateCategory(editingCategory.id, formData)
      } else {
        await blogRepository.insertCategory(formData)
      }
      setIsModalOpen(false)
      loadCategories()
    } catch (error) {
      console.error('Failed to save category', error)
      alert('Error saving category. Slug must be unique.')
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/blog')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Blog Categories</h1>
          <p className="text-slate-500 mt-1">Manage health article categories</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">Loading categories...</TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">No categories found.</TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-slate-500">{cat.slug}</TableCell>
                  <TableCell className="text-slate-500">{cat.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cat)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => {
                  const val = e.target.value
                  setFormData(prev => ({ 
                    ...prev, 
                    name: val, 
                    slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
                          ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
                          : prev.slug 
                  }))
                }} 
                placeholder="e.g. Skin Care" 
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input 
                value={formData.slug} 
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                placeholder="e.g. skin-care" 
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.slug} className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
