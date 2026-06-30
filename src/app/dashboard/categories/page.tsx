'use client'

import { useState, useEffect } from 'react'
import { categoryService } from '@/features/categories/application/category-service'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plus, Edit, Trash2, FolderPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
  subcategories: string[]
  createdAt?: Date
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Modals state
  const [catModal, setCatModal] = useState<{ open: boolean, mode: 'add' | 'edit', id?: string, name: string }>({ open: false, mode: 'add', name: '' })
  const [subCatModal, setSubCatModal] = useState<{ open: boolean, mode: 'add' | 'edit', categoryId: string, oldName?: string, name: string }>({ open: false, mode: 'add', categoryId: '', name: '' })

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await categoryService.getAllCategories()
      setCategories(data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load categories', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Category Actions
  const handleSaveCategory = async () => {
    if (!catModal.name.trim()) return
    try {
      if (catModal.mode === 'add') {
        await categoryService.addCategory(catModal.name)
        toast({ title: 'Success', description: 'Category added successfully' })
      } else if (catModal.mode === 'edit' && catModal.id) {
        await categoryService.updateCategory(catModal.id, catModal.name)
        toast({ title: 'Success', description: 'Category updated successfully' })
      }
      setCatModal({ open: false, mode: 'add', name: '' })
      loadCategories()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${name}"? This will also remove all its subcategories.`)) {
      try {
        await categoryService.deleteCategory(id)
        toast({ title: 'Success', description: 'Category deleted' })
        loadCategories()
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    }
  }

  // Subcategory Actions
  const handleSaveSubcategory = async () => {
    if (!subCatModal.name.trim() || !subCatModal.categoryId) return
    try {
      if (subCatModal.mode === 'add') {
        await categoryService.addSubcategory(subCatModal.categoryId, subCatModal.name)
        toast({ title: 'Success', description: 'Subcategory added successfully' })
      } else if (subCatModal.mode === 'edit' && subCatModal.oldName) {
        await categoryService.updateSubcategory(subCatModal.categoryId, subCatModal.oldName, subCatModal.name)
        toast({ title: 'Success', description: 'Subcategory updated successfully' })
      }
      setSubCatModal({ open: false, mode: 'add', categoryId: '', name: '' })
      loadCategories()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeleteSubcategory = async (categoryId: string, subName: string) => {
    if (window.confirm(`Are you sure you want to delete the subcategory "${subName}"?`)) {
      try {
        await categoryService.removeSubcategory(categoryId, subName)
        toast({ title: 'Success', description: 'Subcategory deleted' })
        loadCategories()
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
          <p className="text-muted-foreground mt-1">Manage product categories and subcategories</p>
        </div>
        <Button onClick={() => setCatModal({ open: true, mode: 'add', name: '' })} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">{category.name}</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setCatModal({ open: true, mode: 'edit', id: category.id, name: category.name })}
                >
                  <Edit className="h-4 w-4 text-blue-500" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {category.subcategories?.map((sub, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
                    <span>{sub}</span>
                    <button 
                      onClick={() => setSubCatModal({ open: true, mode: 'edit', categoryId: category.id, oldName: sub, name: sub })}
                      className="ml-1 text-slate-400 hover:text-blue-500"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSubcategory(category.id, sub)}
                      className="ml-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2 border-dashed"
                  onClick={() => setSubCatModal({ open: true, mode: 'add', categoryId: category.id, name: '' })}
                >
                  <FolderPlus className="h-4 w-4" />
                  Add Subcategory
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Modal */}
      <Dialog open={catModal.open} onOpenChange={(open) => setCatModal(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catModal.mode === 'add' ? 'Add New Category' : 'Edit Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input 
                value={catModal.name} 
                onChange={(e) => setCatModal(prev => ({ ...prev, name: e.target.value }))} 
                placeholder="e.g. Antibiotics" 
              />
            </div>
            <Button onClick={handleSaveCategory} className="w-full">
              {catModal.mode === 'add' ? 'Add Category' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subcategory Modal */}
      <Dialog open={subCatModal.open} onOpenChange={(open) => setSubCatModal(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{subCatModal.mode === 'add' ? 'Add Subcategory' : 'Edit Subcategory'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subcategory Name</Label>
              <Input 
                value={subCatModal.name} 
                onChange={(e) => setSubCatModal(prev => ({ ...prev, name: e.target.value }))} 
                placeholder="e.g. Penicillin" 
              />
            </div>
            <Button onClick={handleSaveSubcategory} className="w-full">
              {subCatModal.mode === 'add' ? 'Add Subcategory' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
