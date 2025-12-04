'use client'

import { useState, useEffect } from 'react'
import { productService } from '@/lib/services/product-service'
import { Product } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash, Search } from 'lucide-react'
import ProductForm from '@/components/products/product-form'

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
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

      <div className="flex items-center gap-2 bg-background border border-input rounded-lg px-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or batch number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 bg-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{product.name || 'Unnamed Product'}</h3>
                <p className="text-sm text-muted-foreground">{product.category || 'Uncategorized'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-semibold">${product.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stock</p>
                  <p className={`font-semibold ${product.stockQuantity < 10 ? 'text-orange-600' : ''}`}>
                    {product.stockQuantity}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Batch</p>
                  <p className="font-semibold text-xs">{product.batchNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expiry</p>
                  <p className="font-semibold text-xs">
                    {new Date(product.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProduct(product)
                    setShowForm(true)
                  }}
                  className="flex-1 gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 gap-1 text-destructive hover:text-destructive"
                >
                  <Trash className="h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No products found</p>
        </Card>
      )}
    </div>
  )
}
