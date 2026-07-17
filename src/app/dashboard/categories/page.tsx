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
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, type: 'category' | 'subcategory', categoryId: string, name: string }>({ open: false, type: 'category', categoryId: '', name: '' })

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
    setDeleteConfirm({ open: true, type: 'category', categoryId: id, name })
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
    setDeleteConfirm({ open: true, type: 'subcategory', categoryId, name: subName })
  }

  const confirmDelete = async () => {
    try {
      if (deleteConfirm.type === 'category') {
        await categoryService.deleteCategory(deleteConfirm.categoryId)
        toast({ title: 'Success', description: 'Category deleted' })
      } else {
        await categoryService.removeSubcategory(deleteConfirm.categoryId, deleteConfirm.name)
        toast({ title: 'Success', description: 'Subcategory deleted' })
      }
      loadCategories()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setDeleteConfirm(prev => ({ ...prev, open: false }))
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
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Category Management</h1>
          <p className="text-slate-500 mt-1">Manage product categories and subcategories</p>
        </div>
        <Button onClick={() => setCatModal({ open: true, mode: 'add', name: '' })} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="flex flex-col bg-white border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-semibold text-slate-800">{category.name}</CardTitle>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                  onClick={() => setCatModal({ open: true, mode: 'edit', id: category.id, name: category.name })}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" 
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 pt-4">
              <div className="flex flex-wrap gap-2">
                {category.subcategories?.map((sub, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white">
                    <span>{sub}</span>
                    <button 
                      onClick={() => setSubCatModal({ open: true, mode: 'edit', categoryId: category.id, oldName: sub, name: sub })}
                      className="ml-1 text-slate-400 hover:text-amber-600 transition-colors focus:outline-none"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSubcategory(category.id, sub)}
                      className="text-slate-400 hover:text-red-600 transition-colors focus:outline-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2 border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
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
            <Button onClick={handleSaveCategory} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all">
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
            <Button onClick={handleSaveSubcategory} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all">
              {subCatModal.mode === 'add' ? 'Add Subcategory' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-slate-600 text-sm">
            {deleteConfirm.type === 'category' ? (
              <p>Are you sure you want to delete the category <strong className="text-slate-900">{deleteConfirm.name}</strong>? This will also remove all its subcategories.</p>
            ) : (
              <p>Are you sure you want to delete the subcategory <strong className="text-slate-900">{deleteConfirm.name}</strong>?</p>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
