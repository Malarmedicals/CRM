'use client'

import { useState } from 'react'
import { Product, ProductDetail, ColorVariant, Material } from '@/lib/models/types'
import { productService } from '@/lib/services/product-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, Plus, Trash2, GripVertical } from 'lucide-react'

interface ProductFormProps {
  product?: Product | null
  onClose: () => void
  onSuccess: () => void
}

export default function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  // Helper to safely convert date from Firestore or other formats
  const convertToDate = (date: any): Date => {
    if (!date) return new Date()
    
    try {
      // Handle Firestore Timestamp
      if (date && typeof date.toDate === 'function') {
        return date.toDate()
      }
      
      // Handle Date object
      if (date instanceof Date) {
        return isNaN(date.getTime()) ? new Date() : date
      }
      
      // Handle string or number
      const dateObj = new Date(date)
      return isNaN(dateObj.getTime()) ? new Date() : dateObj
    } catch (error) {
      console.error('Error converting date:', error)
      return new Date()
    }
  }

  const [formData, setFormData] = useState<Partial<Product>>(
    product ? {
      ...product,
      expiryDate: convertToDate(product.expiryDate),
    } : {
      name: '',
      description: '',
      price: 0,
      discount: 0,
      category: '',
      subcategory: '',
      batchNumber: '',
      expiryDate: new Date(),
      stockQuantity: 0,
      images: [],
      primaryImage: '',
      additionalImages: [],
      productDetails: [],
      colorVariants: [],
      materials: [],
      seoTags: '',
      hsnCode: '',
      gstRate: 18,
      vendor: '',
      brandName: '',
      stockStatus: 'in-stock',
      estimatedDelivery: '',
      freeShippingThreshold: 0,
    }
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [productDetailInput, setProductDetailInput] = useState({ name: '', value: '' })
  const [colorVariantInput, setColorVariantInput] = useState({
    colorName: '',
    variantName: '',
    originalPrice: 0,
    discountPrice: 0,
    unit: 'per-piece',
  })
  const [materialInput, setMaterialInput] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: ['price', 'discount', 'stockQuantity', 'gstRate', 'freeShippingThreshold'].includes(name)
        ? parseFloat(value)
        : name === 'expiryDate'
        ? new Date(value)
        : value,
    }))
  }

  // Helper function to safely format date for input
  const formatDateForInput = (date: any): string => {
    if (!date) return ''
    
    try {
      // Handle Firestore Timestamp
      if (date && typeof date.toDate === 'function') {
        const jsDate = date.toDate()
        if (isNaN(jsDate.getTime())) return ''
        return jsDate.toISOString().split('T')[0]
      }
      
      // Handle Date object
      if (date instanceof Date) {
        if (isNaN(date.getTime())) return ''
        return date.toISOString().split('T')[0]
      }
      
      // Handle string or number
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return ''
      return dateObj.toISOString().split('T')[0]
    } catch (error) {
      console.error('Error formatting date:', error)
      return ''
    }
  }

  const addProductDetail = () => {
    if (productDetailInput.name && productDetailInput.value) {
      const newDetail: ProductDetail = {
        id: Date.now().toString(),
        detailName: productDetailInput.name,
        detailValue: productDetailInput.value,
      }
      setFormData((prev) => ({
        ...prev,
        productDetails: [...(prev.productDetails || []), newDetail],
      }))
      setProductDetailInput({ name: '', value: '' })
    }
  }

  const removeProductDetail = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      productDetails: prev.productDetails?.filter((d) => d.id !== id) || [],
    }))
  }

  const addColorVariant = () => {
    if (colorVariantInput.colorName && colorVariantInput.variantName) {
      const newVariant: ColorVariant = {
        id: Date.now().toString(),
        ...colorVariantInput,
      }
      setFormData((prev) => ({
        ...prev,
        colorVariants: [...(prev.colorVariants || []), newVariant],
      }))
      setColorVariantInput({
        colorName: '',
        variantName: '',
        originalPrice: 0,
        discountPrice: 0,
        unit: 'per-piece',
      })
    }
  }

  const removeColorVariant = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      colorVariants: prev.colorVariants?.filter((v) => v.id !== id) || [],
    }))
  }

  const addMaterial = () => {
    if (materialInput.trim()) {
      const newMaterial: Material = {
        id: Date.now().toString(),
        materialName: materialInput,
      }
      setFormData((prev) => ({
        ...prev,
        materials: [...(prev.materials || []), newMaterial],
      }))
      setMaterialInput('')
    }
  }

  const removeMaterial = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials?.filter((m) => m.id !== id) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (product?.id) {
        await productService.updateProduct(product.id, formData as Partial<Product>)
      } else {
        await productService.addProduct(formData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>)
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const combinationCount = (formData.colorVariants?.length || 0) * (formData.materials?.length || 0)

  return (
    <div className="space-y-6 mb-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">
            ✕
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product Name *</label>
                <Input
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  placeholder="Product Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">GST Rate (%) *</label>
                <select
                  name="gstRate"
                  value={formData.gstRate || 18}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                >
                  <option value="5">5% - Books, Food</option>
                  <option value="12">12% - General Goods</option>
                  <option value="18">18% - Most Goods</option>
                  <option value="28">28% - Luxury Items</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Product Description *</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter detailed product description with advanced formatting..."
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">HSN Code *</label>
                <Input
                  name="hsnCode"
                  value={formData.hsnCode || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 8544, 9405, 6815"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vendor/Supplier *</label>
                <Input
                  name="vendor"
                  value={formData.vendor || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC Suppliers"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Brand Name (Optional)</label>
                <Input
                  name="brandName"
                  value={formData.brandName || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., LG"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stock Status *</label>
                <select
                  name="stockStatus"
                  value={formData.stockStatus || 'in-stock'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                >
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity *</label>
                <Input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity || 0}
                  onChange={handleInputChange}
                  placeholder="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estimated Delivery *</label>
                <Input
                  name="estimatedDelivery"
                  value={formData.estimatedDelivery || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 3-5 business days"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Free Shipping Threshold (₹)</label>
                <Input
                  type="number"
                  name="freeShippingThreshold"
                  value={formData.freeShippingThreshold || 0}
                  onChange={handleInputChange}
                  placeholder="e.g., 5500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter amount above which free shipping applies (leave empty if no threshold)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <Input
                  name="category"
                  value={formData.category || ''}
                  onChange={handleInputChange}
                  placeholder="Enter category"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Batch Number *</label>
                <Input
                  name="batchNumber"
                  value={formData.batchNumber || ''}
                  onChange={handleInputChange}
                  placeholder="Enter batch number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expiry Date *</label>
                <Input
                  type="date"
                  name="expiryDate"
                  value={formatDateForInput(formData.expiryDate)}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">SEO Tags (comma separated) *</label>
              <Input
                name="seoTags"
                value={formData.seoTags || ''}
                onChange={handleInputChange}
                placeholder="product, electronics, best-seller"
                required
              />
            </div>
          </div>

          {/* Product Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Product Image *</label>
                <div className="border-2 border-dashed border-yellow-400 rounded-lg p-8 text-center cursor-pointer hover:bg-yellow-50">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const fileName = e.target.files[0].name
                        setFormData((prev) => ({ ...prev, primaryImage: fileName }))
                      }
                    }}
                  />
                  <button type="button" className="inline-block px-4 py-2 bg-yellow-400 text-white rounded-md">
                    Choose Files
                  </button>
                  <p className="text-sm text-muted-foreground mt-2">No file chosen</p>
                  <p className="text-sm text-muted-foreground mt-4">Click to add primary image</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color Name *</label>
                <Input placeholder="Variant Name (e.g., Warm White)" />
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Original Price (₹) *</label>
                <Input
                  type="number"
                  name="price"
                  value={formData.price || 0}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discount Price (₹) *</label>
                <Input
                  type="number"
                  name="discount"
                  value={formData.discount || 0}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Unit</label>
              <select className="w-full px-3 py-2 border border-input rounded-lg bg-background">
                <option>per-piece</option>
                <option>per-box</option>
                <option>per-kg</option>
                <option>per-liter</option>
              </select>
            </div>
          </div>

          {/* Color Variants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Color Variants</h3>
              <Button
                type="button"
                onClick={addColorVariant}
                className="gap-2 bg-yellow-400 hover:bg-yellow-500"
              >
                <Plus className="h-4 w-4" />
                Add Color Variant (Auto-Copy)
              </Button>
            </div>

            <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  placeholder="Color Name"
                  value={colorVariantInput.colorName}
                  onChange={(e) => setColorVariantInput((prev) => ({ ...prev, colorName: e.target.value }))}
                />
                <Input
                  placeholder="Variant Name (e.g., Warm White)"
                  value={colorVariantInput.variantName}
                  onChange={(e) => setColorVariantInput((prev) => ({ ...prev, variantName: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Original Price (₹)"
                  value={colorVariantInput.originalPrice}
                  onChange={(e) =>
                    setColorVariantInput((prev) => ({ ...prev, originalPrice: parseFloat(e.target.value) }))
                  }
                />
                <Input
                  type="number"
                  placeholder="Discount Price (₹)"
                  value={colorVariantInput.discountPrice}
                  onChange={(e) =>
                    setColorVariantInput((prev) => ({ ...prev, discountPrice: parseFloat(e.target.value) }))
                  }
                />
              </div>
            </div>

            {/* Color Variants List */}
            {formData.colorVariants && formData.colorVariants.length > 0 && (
              <div className="space-y-2">
                {formData.colorVariants.map((variant) => (
                  <div key={variant.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{variant.colorName} - {variant.variantName}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{variant.originalPrice} → ₹{variant.discountPrice}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColorVariant(variant.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Materials */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Global Materials</h3>
              <Button
                type="button"
                onClick={addMaterial}
                className="gap-2 bg-yellow-400 hover:bg-yellow-500"
              >
                <Plus className="h-4 w-4" />
                Add Material
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Material name"
                value={materialInput}
                onChange={(e) => setMaterialInput(e.target.value)}
              />
            </div>

            {/* Combination Info */}
            {(formData.colorVariants?.length || 0) > 0 || (formData.materials?.length || 0) > 0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold text-yellow-600">{formData.colorVariants?.length || 0}</span> color
                  variant(s) × <span className="font-semibold text-yellow-600">{formData.materials?.length || 0}</span>
                  material(s) will create{' '}
                  <span className="font-semibold text-yellow-600">{combinationCount}</span> product(s)
                </p>
              </div>
            ) : null}

            {/* Materials List */}
            {formData.materials && formData.materials.length > 0 && (
              <div className="space-y-2">
                {formData.materials.map((material) => (
                  <div key={material.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="flex-1 font-medium">{material.materialName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMaterial(material.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Details</h3>
            <div className="bg-yellow-400 text-white p-3 rounded-lg mb-3">
              <div className="grid grid-cols-2 gap-4 font-semibold">
                <div>Detail Name</div>
                <div>Detail Value</div>
              </div>
            </div>

            <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <Input
                  placeholder="Detail name (e.g., Warranty, Size)"
                  value={productDetailInput.name}
                  onChange={(e) => setProductDetailInput((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Detail value (e.g., 2 Years, Metal)"
                  value={productDetailInput.value}
                  onChange={(e) => setProductDetailInput((prev) => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                onClick={addProductDetail}
                className="w-full gap-2 bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                <Plus className="h-4 w-4" />
                Add Detail
              </Button>
            </div>

            {/* Product Details List */}
            {formData.productDetails && formData.productDetails.length > 0 && (
              <div className="space-y-2">
                {formData.productDetails.map((detail) => (
                  <div key={detail.id} className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_50px] gap-2 items-center p-3 bg-gray-50 rounded-lg">
                    <GripVertical className="h-4 w-4 text-muted-foreground hidden md:block" />
                    <Input placeholder="Detail name" value={detail.detailName} readOnly />
                    <Input placeholder="Detail value" value={detail.detailValue} readOnly />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProductDetail(detail.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Product Images */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Additional Product Images</h3>
              <Button
                type="button"
                className="gap-2 bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                <Plus className="h-4 w-4" />
                Add Image
              </Button>
            </div>
          </div>

          {/* Create New Combination */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create New Combination</h3>
              <Button type="button" className="gap-2 bg-yellow-400 hover:bg-yellow-500 text-black">
                <Plus className="h-4 w-4" />
                New Combination
              </Button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
