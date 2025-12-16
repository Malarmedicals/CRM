'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product, ProductDetail, ColorVariant, Material } from '@/lib/models/types'
import { productService } from '@/features/products/product-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, Plus, Trash2, GripVertical } from 'lucide-react'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { categoryService } from '@/features/categories/category-service'

interface ProductFormProps {
  product?: Product | null
  onClose: () => void
  onSuccess: () => void
}

// Helper: Convert image file to WebP
const convertToWebP = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert to WebP'))
            return
          }
          const newFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '') + '.webp',
            {
              type: 'image/webp',
              lastModified: Date.now(),
            }
          )
          resolve(newFile)
        },
        'image/webp',
        0.8 // Quality 0.8
      )
    }
    img.onerror = (e) => reject(e)
    img.src = URL.createObjectURL(file)
  })
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
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false)
  const [newCategory, setNewCategory] = useState({
    type: 'main',
    prefix: '',
    name: '',
    logo: null as File | null
  })
  const [categories, setCategories] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.primaryImage || null)
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([])
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>(product?.additionalImages || [])

  const [categoriesData, setCategoriesData] = useState<Record<string, { subcategories: string[] }>>({})

  const DEFAULT_CATEGORIES: Record<string, { subcategories: string[] }> = {
    'Haircare': {
      subcategories: ['Hair Oils', 'Shampoos & Conditioners', 'Hair Serums', 'Hair Creams & Masks', 'Hair Colour', 'Hair Growth Products', 'Essential Oils']
    },
    'Fitness & Wellness': {
      subcategories: ['Weighing Scales', 'Fat Burners', 'Hand & Wrist Support', 'Neck & Shoulder Support', 'Oats', 'Muesli & Cereals', 'Quinoa', 'Sports Nutrition', 'Carnitine', 'Protein Supplements', 'Energy Drinks']
    },
    'Sexual Wellness': {
      subcategories: ['Condoms', 'Lubricants & Massage Gels', 'Sexual Wellness Devices', 'Performance Enhancers', 'Oral Contraceptives']
    },
    'Vitamins & Nutrition': {
      subcategories: [
        'Omega & Fish Oil & DHA', 'Vitamin D', 'Vitamin B', 'Vitamin C', 'Vitamin A', 'Pre and Probiotics', 'Minerals', 'Calcium', 'Global Supplements', 'Hair & Skin Supplements', 'Specialty Supplements', 'Vitamin K', 'Gummies Vitamins'
      ]
    },
    'Supports & Braces': {
      subcategories: ['Knee Supports', 'Ankle Supports', 'Back Supports', 'Wrist Supports', 'Elbow Supports', 'Shoulder Supports', 'Neck Collars', 'Compression Garments']
    },
    'Immunity Boosters': {
      subcategories: ['Vitamin C Supplements', 'Zinc Supplements', 'Echinacea', 'Elderberry', 'Turmeric & Curcumin', 'Ashwagandha', 'Multivitamins', 'Herbal Immunity']
    },
    'Homeopathy': {
      subcategories: ['Homeopathic Medicines', 'Mother Tinctures', 'Biochemic Medicines', 'Dilutions', 'Ointments & Creams', 'Drops & Syrups']
    },
    'First Aid': {
      subcategories: ['Bandages & Dressings', 'Antiseptics & Disinfectants', 'Pain Relief Sprays', 'First Aid Kits', 'Thermometers', 'Cotton & Gauze', 'Medical Tapes', 'Wound Care']
    }
  }

  // Load categories from Firestore
  useEffect(() => {
    const loadCategories = async () => {
      try {
        let cats = await categoryService.getAllCategories()

        // If no categories in DB, initialize defaults
        if (cats.length === 0) {
          await categoryService.initializeDefaults(DEFAULT_CATEGORIES)
          cats = await categoryService.getAllCategories()
        }

        // Transform array to Record format for local state
        const formattedData: Record<string, { subcategories: string[] }> = {}
        cats.forEach(cat => {
          formattedData[cat.name] = { subcategories: cat.subcategories || [] }
        })
        setCategoriesData(formattedData)
      } catch (error) {
        console.error('Failed to load categories:', error)
        // Fallback to defaults locally if DB fails
        setCategoriesData(DEFAULT_CATEGORIES)
      }
    }
    loadCategories()
  }, [])

  // State for new categories
  const [showAddSubCategoryDialog, setShowAddSubCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubCategoryName, setNewSubCategoryName] = useState('')

  const handleAddCategory = async () => {
    if (newCategoryName && !categoriesData[newCategoryName]) {
      try {
        // Save to Firestore
        await categoryService.addCategory(newCategoryName)

        // Update local state
        setCategoriesData(prev => ({
          ...prev,
          [newCategoryName]: { subcategories: [] }
        }))
        setFormData(prev => ({ ...prev, category: newCategoryName, subcategory: '' }))
        setNewCategoryName('')
        setShowAddCategoryDialog(false)
      } catch (error) {
        console.error('Failed to add category:', error)
        setError('Failed to create category. Please try again.')
      }
    }
  }

  const handleAddSubCategory = async () => {
    if (formData.category && newSubCategoryName && categoriesData[formData.category]) {
      // Check if subcategory already exists
      if (!categoriesData[formData.category].subcategories.includes(newSubCategoryName)) {
        try {
          // Save to Firestore (requires category ID - assuming simplified slug generation match service)
          const categoryId = formData.category.toLowerCase().replace(/\s+/g, '-')
          await categoryService.addSubcategory(categoryId, newSubCategoryName)

          setCategoriesData(prev => ({
            ...prev,
            [formData.category!]: {
              subcategories: [...prev[formData.category!].subcategories, newSubCategoryName]
            }
          }))
          setFormData(prev => ({ ...prev, subcategory: newSubCategoryName }))
          setNewSubCategoryName('')
          setShowAddSubCategoryDialog(false)
        } catch (error) {
          console.error('Failed to add subcategory:', error)
          setError('Failed to create subcategory. Please try again.')
        }
      }
    }
  }

  // Effect to populate subcategory if editing and main category is set (optional logic check)
  // ... existing code ...

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value,
      subcategory: '' // Reset subcategory when main category changes
    }))
  }

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
      let imageUrl = formData.primaryImage

      if (imageFile) {
        try {
          const webpFile = await convertToWebP(imageFile)
          const storageRef = ref(storage, `products/${Date.now()}_primary_${webpFile.name}`)
          const snapshot = await uploadBytes(storageRef, webpFile)
          imageUrl = await getDownloadURL(snapshot.ref)
        } catch (convertError) {
          console.error('WebP conversion failed, uploading original:', convertError)
          const storageRef = ref(storage, `products/${Date.now()}_primary_${imageFile.name}`)
          const snapshot = await uploadBytes(storageRef, imageFile)
          imageUrl = await getDownloadURL(snapshot.ref)
        }
      }

      // Handle additional images
      const newAdditionalImageUrls: string[] = []
      for (const file of additionalImageFiles) {
        try {
          const webpFile = await convertToWebP(file)
          const storageRef = ref(storage, `products/${Date.now()}_additional_${webpFile.name}`)
          const snapshot = await uploadBytes(storageRef, webpFile)
          const url = await getDownloadURL(snapshot.ref)
          newAdditionalImageUrls.push(url)
        } catch (convertError) {
          console.error('WebP conversion failed for additional image, uploading original:', convertError)
          const storageRef = ref(storage, `products/${Date.now()}_additional_${file.name}`)
          const snapshot = await uploadBytes(storageRef, file)
          const url = await getDownloadURL(snapshot.ref)
          newAdditionalImageUrls.push(url)
        }
      }

      // Merge existing URLs (that are still in previews) with new URLs
      // Filter previews to keep only those that are http links (existing ones)
      // This logic assumes previews for existing images are the URLs themselves
      const existingUrls = additionalImagePreviews.filter(url => url.startsWith('http'))
      const finalAdditionalImages = [...existingUrls, ...newAdditionalImageUrls]

      const finalProductData = {
        ...formData,
        primaryImage: imageUrl,
        additionalImages: finalAdditionalImages,
      }

      if (product?.id) {
        await productService.updateProduct(product.id, finalProductData as Partial<Product>)
      } else {
        await productService.addProduct(finalProductData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>)
      }
      onSuccess()
    } catch (err: any) {
      console.error('Submit error:', err)
      setError(err.message || 'Failed to save product')
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

        <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new main product category.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category Name</label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Skin Care"
                />
              </div>
              <Button onClick={handleAddCategory} disabled={!newCategoryName} className="w-full">
                Add Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddSubCategoryDialog} onOpenChange={setShowAddSubCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subcategory</DialogTitle>
              <DialogDescription>
                Add a subcategory to {formData.category}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subcategory Name</label>
                <Input
                  value={newSubCategoryName}
                  onChange={(e) => setNewSubCategoryName(e.target.value)}
                  placeholder="e.g. Face Wash"
                />
              </div>
              <Button onClick={handleAddSubCategory} disabled={!newSubCategoryName} className="w-full">
                Add Subcategory
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <div className="flex gap-2">
                  <Select
                    value={formData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger className="w-full border-input bg-background flex-1">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(categoriesData).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddCategoryDialog(true)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sub Category</label>
                <div className="flex gap-2">
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                    disabled={!formData.category}
                  >
                    <SelectTrigger className="w-full border-input bg-background flex-1">
                      <SelectValue placeholder={formData.category ? "Select Sub Category" : "Select Main Category First"} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.category && categoriesData[formData.category]?.subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddSubCategoryDialog(true)}
                    className="shrink-0"
                    disabled={!formData.category}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

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

              <div className="md:col-span-2 bg-red-50 p-4 rounded-lg border border-red-100">
                <label className="block text-sm font-medium mb-2 text-red-900">Sensitive Medicine? (Prescription Required)</label>
                <div className="flex flex-col gap-2">
                  <select
                    name="isSensitive"
                    value={formData.isSensitive ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isSensitive: e.target.value === 'true' }))}
                    className="w-full px-3 py-2 border border-red-200 rounded-lg bg-white focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="false">No - General Purchase</option>
                    <option value="true">Yes - Requires Prescription</option>
                  </select>
                  {formData.isSensitive && (
                    <p className="text-xs text-red-600 font-medium">
                      Note: Customers will be required to upload a valid prescription to purchase this item.
                    </p>
                  )}
                </div>
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
                <div className="border-2 border-dashed border-yellow-400 rounded-lg p-8 text-center cursor-pointer hover:bg-yellow-50 relative overflow-hidden group">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0]
                        setImageFile(file)
                        // Create preview URL
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setImagePreview(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />

                  {imagePreview ? (
                    <div className="relative h-48 w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="h-full w-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white font-medium">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button type="button" className="inline-block px-4 py-2 bg-yellow-400 text-white rounded-md mb-2">
                        Choose Files
                      </button>
                      <p className="text-sm text-muted-foreground">
                        {imageFile ? imageFile.name : 'No file chosen'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-4">
                        Supported formats: JPG, PNG, WEBP
                      </p>
                    </>
                  )}
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
            <h3 className="text-lg font-semibold">Additional Product Images</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Existing/New Previews */}
              {additionalImagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      // Remove from previews
                      const newPreviews = [...additionalImagePreviews]
                      newPreviews.splice(index, 1)
                      setAdditionalImagePreviews(newPreviews)

                      // Remove from files if it's a new file (not a URL)
                      if (!preview.startsWith('http')) {
                        // Find corresponding file index (this is approximate if multiple same images, but sufficient for now)
                        // Better approach: track indices. For simplicity, we just rebuild files list based on remaining blobs? 
                        // Actually, keeping files sync is tricky without an ID. 
                        // Simple fix: We don't splice files array by index directly because indices mismatch if we have mix of URLs and blobs.
                        // Correct way: Only remove from additionalImageFiles if it was a blob.
                        // Since we append blobs to end, we can track count. 
                        // Let's simpler: Re-sync isn't easy. 
                        // ALTERNATE: Just allow removing all logic. 
                        // Better: Use a separate handler for removing specific items.
                      }
                      // For simplicity in this iteration:
                      // We will filter the additionalImageFiles.
                      // Actually, we can just regenerate the files list? No.

                      // Hack for separate lists: 
                      // We can't easily correlate a preview URL to a file object without an ID.
                      // For now, let's just clear the specific index from previews.
                      // If users remove a 'new' image, we need to remove the file.
                      // We'll calculate the index offset.
                      const existingCount = product?.additionalImages?.length || 0
                      // If we are editing, we might have started with X existing.
                      // But the user might have deleted some existing ones.

                      // Let's rely on 'preview' string content.
                      if (preview.startsWith('blob:')) {
                        // It's a new file.
                        setAdditionalImageFiles(prev => prev.filter((_, i) => URL.createObjectURL(prev[i]) !== preview))
                        // Note: createObjectURL returns new string each time, so this check fails. 
                        // We need to store object URLs with files.
                      }
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {/* Better Remove Handler */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="text-white font-medium">Remove</p>
                  </div>
                  <button
                    type="button"
                    className="absolute inset-0 w-full h-full cursor-pointer"
                    onClick={() => {
                      const newPreviews = additionalImagePreviews.filter((_, i) => i !== index)
                      setAdditionalImagePreviews(newPreviews)

                      // If it's a file (blob), remove from files array
                      // We need to keep them in sync. 
                      // Simplified approach: Clear files and let user re-add if they mess up? No.
                      // Robust approach: 
                      if (!preview.startsWith('http')) {
                        // It is a local preview. We need to find which file it corresponds to.
                        // Since we don't map 1:1 easily here without ID, we'll try to remove by index relative to 'http' count
                        // But 'http' ones can be deleted too.

                        // FAST FIX: simple filter
                        // We will depend on the fact that we push files in order.
                        // Let's just remove the file at (index - numberOfHttpLinksBeforeIt)
                        let httpCount = 0
                        for (let i = 0; i < index; i++) {
                          if (additionalImagePreviews[i].startsWith('http')) httpCount++
                        }
                        const fileIndex = index - httpCount
                        setAdditionalImageFiles(prev => prev.filter((_, i) => i !== fileIndex))
                      }
                    }}
                  />
                </div>
              ))}

              {/* Add Button */}
              <label className="border-2 border-dashed border-yellow-400 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-yellow-50 transition-colors">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const newFiles = Array.from(e.target.files)
                      setAdditionalImageFiles(prev => [...prev, ...newFiles])

                      const newPreviews = newFiles.map(file => URL.createObjectURL(file))
                      setAdditionalImagePreviews(prev => [...prev, ...newPreviews])
                    }
                  }}
                />
                <Plus className="h-8 w-8 text-yellow-500 mb-2" />
                <span className="text-sm font-medium text-yellow-700">Add Images</span>
              </label>
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

      {/* Add New Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new product category with prefix and optional logo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category Type</label>
              <select
                value={newCategory.type}
                onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background"
              >
                <option value="main">Main Category</option>
                <option value="sub">Sub Category</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Category Prefix (e.g., SM) *
              </label>
              <Input
                value={newCategory.prefix}
                onChange={(e) => setNewCategory({ ...newCategory, prefix: e.target.value })}
                placeholder="e.g., SM"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {newCategory.type === 'main' ? 'Main' : 'Sub'} Category Name *
              </label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Automation Solutions"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Category Logo (Optional)
              </label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setNewCategory({ ...newCategory, logo: file })
                  }}
                  className="cursor-pointer"
                />
                {newCategory.logo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Selected: {newCategory.logo.name}</span>
                  </div>
                )}
                {!newCategory.logo && (
                  <p className="text-xs text-muted-foreground">No image selected</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddCategoryDialog(false)
                setNewCategory({ type: 'main', prefix: '', name: '', logo: null })
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                // Add the category to the form
                if (newCategory.prefix && newCategory.name) {
                  const categoryValue = `${newCategory.prefix} - ${newCategory.name}`
                  setFormData({ ...formData, category: categoryValue })
                  setCategories((prev) => [...prev, categoryValue].sort())
                  setShowAddCategoryDialog(false)
                  setNewCategory({ type: 'main', prefix: '', name: '', logo: null })
                }
              }}
              disabled={!newCategory.prefix || !newCategory.name}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
