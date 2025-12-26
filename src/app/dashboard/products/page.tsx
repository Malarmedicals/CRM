'use client'

import { useState, useEffect } from 'react'
import { productService } from '@/features/products/product-service'
import { Product } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash, Search, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import ProductForm from '@/features/products/product-form'
import { ProductCard } from '@/components/products/product-card'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground mt-1">Manage medicines and products</p>
        </div>
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
