'use client'

import { useState, useEffect } from 'react'
import { productService } from '@/features/products'
import type { Product } from '@/features/products/domain/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash, Search, Package, ChevronLeft, ChevronRight, Upload, Download, FileSpreadsheet } from 'lucide-react'
import ProductForm from '@/features/products/product-form'
import { ProductCard } from '@/components/products/product-card'
import { BulkImportModal } from '@/features/products/bulk-import-modal'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (!Array.isArray(products)) {
      setFilteredProducts([])
      return
    }

    const searchLower = String(searchTerm || '').toLowerCase()
    const filtered = products.filter((product) => {
      if (!product) return false
      
      const name = String(product.name || '').toLowerCase()
      const batchNumber = String(product.batchNumber || '')
      const matchesSearch = name.includes(searchLower) || batchNumber.includes(searchTerm || '')
      
      if (!matchesSearch) return false

      // Status/Stock Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && product.status !== 'published') return false
        if (statusFilter === 'draft' && product.status !== 'draft') return false
        if (statusFilter === 'out_of_stock' && product.stockQuantity > 0) return false
        if (statusFilter === 'low_stock' && (product.stockQuantity === 0 || product.stockQuantity >= (product.minStockLevel || 10))) return false
      }

      // Visibility Filter
      if (visibilityFilter !== 'all') {
        if (visibilityFilter === 'new_arrival' && !product.seo?.isNewArrival) return false
        if (visibilityFilter === 'best_seller' && !product.seo?.isBestSeller) return false
        if (visibilityFilter === 'trending' && !product.seo?.isTrending) return false
        if (visibilityFilter === 'daily_essential' && !product.seo?.isDailyEssential) return false
      }

      return true
    })
    setFilteredProducts(filtered)
  }, [searchTerm, statusFilter, visibilityFilter, products])

  const loadProducts = async () => {
    try {
      const data = await productService.getAllProducts()
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(id)
        setProducts(products.filter((p) => p.id !== id))
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  const handleToggleVisibility = async (productId: string, flag: 'isNewArrival' | 'isBestSeller' | 'isTrending' | 'isDailyEssential', value: boolean) => {
    try {
      const product = products.find(p => p.id === productId)
      if (!product) return

      const updatedSeo = {
        ...(product.seo || {}),
        [flag]: value
      }

      await productService.updateProduct(productId, { seo: updatedSeo })

      setProducts(products.map(p => 
        p.id === productId ? { ...p, seo: updatedSeo } : p
      ))
    } catch (error) {
      console.error('Failed to update visibility flag:', error)
    }
  }

  const handleExportProducts = () => {
    if (products.length === 0) {
      alert('No products to export')
      return
    }
    const exportData = products.map(p => ({
      'Product Name': p.name,
      'Description': p.description,
      'Category': p.category,
      'Subcategory': p.subcategory,
      'Brand': p.brandName,
      'MRP': p.mrp,
      'Selling Price': p.discount,
      'Stock Quantity': p.stockQuantity,
      'Minimum Stock': p.minStockLevel,
      'Batch Number': p.batchNumber,
      'Expiry Date': p.expiryDate ? new Date(p.expiryDate).toISOString().split('T')[0] : '',
      'GST Rate (%)': p.gstRate,
      'HSN Code': p.hsnCode,
      'Composition': p.medicalInfo?.composition,
      'Dosage Form': p.medicalInfo?.dosageForm,
      'Strength': p.medicalInfo?.strength,
      'Indications': p.medicalInfo?.indications,
      'Side Effects': p.medicalInfo?.sideEffects,
      'Contraindications': p.medicalInfo?.contraindications,
      'Storage Instructions': p.medicalInfo?.storageInstructions,
      'Prescription Required': p.compliance?.prescriptionRequired ? 'Yes' : 'No',
      'Narcotic': p.compliance?.scheduleType === 'x' ? 'Yes' : 'No',
      'Schedule Type': p.compliance?.scheduleType,
      'Meta Title': p.seo?.metaTitle,
      'Meta Description': p.seo?.metaDescription,
      'Keywords': p.seo?.metaKeywords,
    }))
    const csvContent = Papa.unparse(exportData)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'products_export.csv'
    link.click()
  }



  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground mt-1">Manage medicines and products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportProducts} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowBulkImport(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button
            onClick={() => router.push('/dashboard/products/add')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {showBulkImport && (
        <BulkImportModal 
          onClose={() => setShowBulkImport(false)} 
          onSuccess={() => {
            setShowBulkImport(false)
            loadProducts()
          }} 
        />
      )}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-background border border-input rounded-lg p-2 shadow-sm">
        <div className="flex items-center gap-2 flex-1 w-full px-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 px-0"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] border-0 bg-transparent shadow-none focus:ring-0 h-8">
              <SelectValue placeholder="Status/Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="w-full sm:w-[150px] border-0 bg-transparent shadow-none focus:ring-0 h-8">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="new_arrival">New Arrivals</SelectItem>
              <SelectItem value="best_seller">Best Sellers</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="daily_essential">Daily Essentials</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={() => router.push(`/dashboard/products/${product.id}/edit`)}
            onDelete={() => handleDelete(product.id)}
            onToggleVisibility={(flag, value) => handleToggleVisibility(product.id, flag, value)}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <Card className="p-8 text-center text-muted-foreground">
          No products found
        </Card>
      )}
    </div>
  )
}
