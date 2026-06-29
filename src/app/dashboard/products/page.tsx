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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

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
      return name.includes(searchLower) || batchNumber.includes(searchTerm || '')
    })
    setFilteredProducts(filtered)
  }, [searchTerm, products])

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

  const handleFormClose = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  const handleFormSuccess = () => {
    loadProducts()
    handleFormClose()
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
      'Cold Chain Required': p.shipping?.coldChainRequired ? 'Yes' : 'No',
      'Extra Handling Fee': p.shipping?.extraHandlingFee,
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

  const handleDownloadTemplate = () => {
    const headers = [
      'Product Name', 'Description', 'Category', 'Subcategory', 'Brand',
      'MRP', 'Selling Price', 'Stock Quantity', 'Minimum Stock', 'Batch Number', 'Expiry Date',
      'Composition', 'Dosage Form', 'Strength', 'Indications', 'Side Effects', 'Contraindications', 'Storage Instructions',
      'Prescription Required', 'Narcotic', 'Schedule Type',
      'Cold Chain Required', 'Extra Handling Fee',
      'Meta Title', 'Meta Description', 'Keywords'
    ]
    const sampleRow = [
      'Paracetamol 500mg', 'Used for fever and pain relief', 'Medicines', 'Fever', 'Cipla',
      '50', '45', '100', '10', 'B2025-01', '2026-12-31',
      'Paracetamol IP 500mg', 'Tablet', '500mg', 'Fever, Mild pain', 'Nausea, Rash', 'Liver disease', 'Store in a cool, dry place',
      'No', 'No', 'OTC',
      'No', '0',
      'Buy Paracetamol 500mg Online', 'Get fast relief from fever with Paracetamol 500mg.', 'paracetamol, fever, painkiller'
    ]
    const csvContent = Papa.unparse([headers, sampleRow])
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'product_import_template.csv'
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
          <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            Template
          </Button>
          <Button variant="outline" onClick={handleExportProducts} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowBulkImport(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button
            onClick={() => {
              setEditingProduct(null)
              setShowForm(true)
            }}
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

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      <div className="flex items-center gap-2 bg-background border border-input rounded-lg px-4 shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or batch number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={() => {
              setEditingProduct(product)
              setShowForm(true)
            }}
            onDelete={() => handleDelete(product.id)}
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
