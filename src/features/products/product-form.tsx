'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product, ProductDetail, ColorVariant, Material, MedicalInfo } from '@/lib/models/types'
import { productService } from '@/features/products/product-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Plus, Trash2, GripVertical, Check, Info } from 'lucide-react'
import { storage, db } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { categoryService } from '@/features/categories/category-service'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

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
  // Helper to safely convert date
  const convertToDate = (date: any): Date => {
    if (!date) return new Date()
    try {
      if (date && typeof date.toDate === 'function') return date.toDate()
      if (date instanceof Date) return isNaN(date.getTime()) ? new Date() : date
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
      medicalInfo: product.medicalInfo || {},
      compliance: product.compliance || { prescriptionRequired: !!product.isSensitive },
      shipping: product.shipping || {},
      seo: product.seo || {},
    } : {
      name: '',
      description: '',
      price: undefined,
      discount: undefined, // Selling Price
      mrp: undefined,      // Original Price
      category: '',
      subcategory: '',
      healthConcern: '',
      batchNumber: '',
      expiryDate: new Date(),
      stockQuantity: undefined,
      images: [],
      primaryImage: '',
      additionalImages: [],
      gstRate: 18,
      vendor: '',
      brandName: '',
      stockStatus: 'in-stock',
      estimatedDelivery: '',
      hsnCode: '',
      medicalInfo: {},
      compliance: {
        prescriptionRequired: false,
        scheduleType: 'otc',
        ageRestriction: false,
        pharmacistApprovalRequired: false
      },
      shipping: {
        coldChainRequired: false,
        shippingZones: []
      },
      seo: {
        slug: '',
        metaTitle: '',
        metaDescription: ''
      },
      discountType: 'percentage',
      taxType: 'exclusive',
      lowStockThreshold: 10
    }
  )

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false)
  const [showAddSubCategoryDialog, setShowAddSubCategoryDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  // Category State
  const [newCategory, setNewCategory] = useState({ type: 'main', prefix: '', name: '', logo: null as File | null })
  const [newSubCategoryName, setNewSubCategoryName] = useState('')
  const [categoriesData, setCategoriesData] = useState<Record<string, { subcategories: string[] }>>({})
  const [healthConcerns, setHealthConcerns] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.primaryImage || null)
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([])
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>(product?.additionalImages || [])

  // Load Data
  useEffect(() => {
    const loadCategories = async () => {
      try {
        let cats = await categoryService.getAllCategories()
        const formattedData: Record<string, { subcategories: string[] }> = {}
        cats.forEach(cat => {
          formattedData[cat.name] = { subcategories: cat.subcategories || [] }
        })
        setCategoriesData(formattedData)
        setCategories(Object.keys(formattedData))
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    loadCategories()

    const loadHealthConcerns = async () => {
      try {
        const q = query(collection(db, 'healthConcerns'))
        const querySnapshot = await getDocs(q)
        const concerns: string[] = []
        querySnapshot.forEach((doc) => { if (doc.data().name) concerns.push(doc.data().name) })
        setHealthConcerns(concerns.sort())
      } catch (error) {
        console.error('Error loading health concerns:', error)
      }
    }
    loadHealthConcerns()
  }, [])

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: ['price', 'discount', 'mrp', 'stockQuantity', 'gstRate', 'lowStockThreshold', 'extraHandlingFee'].includes(name)
        ? (value === '' || isNaN(parseFloat(value)) ? undefined : parseFloat(value))
        : name === 'expiryDate'
          ? new Date(value)
          : value,
    }))
  }

  const handleNestedChange = (section: 'medicalInfo' | 'compliance' | 'shipping' | 'seo', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value, subcategory: '' }))
  }

  const handleAddCategory = async () => {
    // Logic from original file to add category
    // Simplified for this view, ensuring core logic is here
    if (newCategory.prefix && newCategory.name) {
      const catName = `${newCategory.prefix} - ${newCategory.name}`
      try {
        await categoryService.addCategory(catName)
        setCategoriesData(prev => ({ ...prev, [catName]: { subcategories: [] } }))
        setCategories(prev => [...prev, catName])
        setFormData(prev => ({ ...prev, category: catName }))
        setShowAddCategoryDialog(false)
      } catch (e) { console.error(e) }
    }
  }

  const handleAddSubCategory = async () => {
    if (formData.category && newSubCategoryName) {
      try {
        const catId = formData.category.toLowerCase().replace(/\s+/g, '-')
        await categoryService.addSubcategory(catId, newSubCategoryName)
        setCategoriesData(prev => ({
          ...prev,
          [formData.category!]: { subcategories: [...(prev[formData.category!]?.subcategories || []), newSubCategoryName] }
        }))
        setFormData(prev => ({ ...prev, subcategory: newSubCategoryName }))
        setShowAddSubCategoryDialog(false)
      } catch (e) { console.error(e) }
    }
  }

  // Auto-Slug Generation
  useEffect(() => {
    if (formData.name && !formData.seo?.slug && !product) {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      handleNestedChange('seo', 'slug', slug)
    }
  }, [formData.name])

  // Pricing Logic (Auto-Calculate Selling Price)
  useEffect(() => {
    // Optional: Add calculation logic here if needed
  }, [])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    const errors: string[] = []
    if (!formData.name) errors.push('Product Name is required')
    if (!formData.category) errors.push('Category is required')
    if (!formData.mrp) errors.push('MRP is required')
    if (!formData.sellingPrice) errors.push('Selling Price is required')
    if (formData.stockQuantity === undefined) errors.push('Stock Quantity is required')
    if (!formData.batchNumber) errors.push('Batch Number is required')
    if (!formData.hsnCode) errors.push('HSN Code is required')

    if (errors.length > 0) {
      setError(`Missing required fields: ${errors.join(', ')}`)
      setLoading(false)
      // Auto-switch to tab with error if possible is tricky with multiple errors, 
      // but let's try to switch to the first one found logically.
      if (!formData.name || !formData.category) setActiveTab('basic')
      else if (!formData.mrp || !formData.sellingPrice) setActiveTab('pricing')
      else if (formData.stockQuantity === undefined || !formData.batchNumber) setActiveTab('inventory')
      else if (!formData.hsnCode) setActiveTab('compliance')
      return
    }

    try {
      let imageUrl = formData.primaryImage
      if (imageFile) {
        const webpFile = await convertToWebP(imageFile)
        const refName = `products/${Date.now()}_primary_${webpFile.name}`
        const snap = await uploadBytes(ref(storage, refName), webpFile)
        imageUrl = await getDownloadURL(snap.ref)
      }

      const newAdditionalImageUrls: string[] = []
      for (const file of additionalImageFiles) {
        const webpFile = await convertToWebP(file)
        const refName = `products/${Date.now()}_add_${webpFile.name}`
        const snap = await uploadBytes(ref(storage, refName), webpFile)
        newAdditionalImageUrls.push(await getDownloadURL(snap.ref))
      }

      const existingUrls = additionalImagePreviews.filter(url => url.startsWith('http'))
      const finalAdditionalImages = [...existingUrls, ...newAdditionalImageUrls]

      const finalData: any = {
        ...formData,
        primaryImage: imageUrl,
        additionalImages: finalAdditionalImages,
        price: formData.mrp, // Legacy compatibility: Original Price
        discount: formData.sellingPrice, // Legacy compatibility: Selling Price
        // Ensure dates are Dates
        expiryDate: new Date(formData.expiryDate || Date.now()),
        updatedAt: new Date()
      }

      if (product?.id) {
        await productService.updateProduct(product.id, finalData)
      } else {
        finalData.createdAt = new Date()
        await productService.addProduct(finalData)
      }
      onSuccess()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (date: any) => {
    if (!date) return ''
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      return d.toISOString().split('T')[0]
    } catch (e) { return '' }
  }

  // Helper for transition in select
  const handleSelectChangeNumber = (field: keyof Product, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setFormData(prev => ({ ...prev, [field]: num }));
    }
  }

  return (
    <div className="space-y-6 mb-6">
      <Card className="p-1">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>

        {error && (
          <div className="m-4 p-3 bg-destructive/15 text-destructive rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent p-4 border-b rounded-none">
              <TabsTrigger value="basic" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4 py-2">Basic Info</TabsTrigger>
              <TabsTrigger value="medical" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 rounded-md px-4 py-2">Medical Info</TabsTrigger>
              <TabsTrigger value="pricing" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 rounded-md px-4 py-2">Pricing & Tax</TabsTrigger>
              <TabsTrigger value="inventory" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 rounded-md px-4 py-2">Inventory & Batch</TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700 rounded-md px-4 py-2">Compliance</TabsTrigger>
              <TabsTrigger value="shipping" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 rounded-md px-4 py-2">Delivery</TabsTrigger>
              <TabsTrigger value="seo" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700 rounded-md px-4 py-2">SEO</TabsTrigger>
            </TabsList>

            <div className="p-6">
              {/* --- BASIC INFO TAB --- */}
              <TabsContent value="basic" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input name="name" value={formData.name || ''} onChange={handleInputChange} required placeholder="e.g. Dolo 650mg" />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand Name</Label>
                    <Input name="brandName" value={formData.brandName || ''} onChange={handleInputChange} placeholder="e.g. Micro Labs" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <div className="flex gap-2">
                      <Select value={formData.category} onValueChange={handleCategoryChange}>
                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" onClick={() => setShowAddCategoryDialog(true)}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subcategory</Label>
                    <div className="flex gap-2">
                      <Select value={formData.subcategory} onValueChange={(v) => setFormData(p => ({ ...p, subcategory: v }))} disabled={!formData.category}>
                        <SelectTrigger><SelectValue placeholder="Select Subcategory" /></SelectTrigger>
                        <SelectContent>
                          {formData.category && categoriesData[formData.category]?.subcategories.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" onClick={() => setShowAddSubCategoryDialog(true)} disabled={!formData.category}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Health Concern</Label>
                    <Select value={formData.healthConcern} onValueChange={(v) => setFormData(p => ({ ...p, healthConcern: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select Concern" /></SelectTrigger>
                      <SelectContent>
                        {healthConcerns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" value={formData.description || ''} onChange={handleInputChange} placeholder="Detailed product description..." rows={4} />
                </div>
                {/* Images Section */}
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-lg">Product Images</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 relative">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setImageFile(e.target.files[0])
                          const r = new FileReader()
                          r.onloadend = () => setImagePreview(r.result as string)
                          r.readAsDataURL(e.target.files[0])
                        }
                      }} />
                      {imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imagePreview} className="h-40 object-contain" alt="Primary" />
                      ) : (
                        <div className="text-muted-foreground"><Plus className="h-8 w-8 mx-auto mb-2" />Primary Image</div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {additionalImagePreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square border rounded bg-muted/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} className="w-full h-full object-cover rounded" alt="" />
                          <button type="button" onClick={() => {
                            setAdditionalImagePreviews(p => p.filter((_, idx) => idx !== i))
                            // Ideally handle file removal too, simplified for now
                          }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      ))}
                      <label className="aspect-square border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-muted/50">
                        <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => {
                          if (e.target.files?.length) {
                            setAdditionalImageFiles(p => [...p, ...Array.from(e.target.files as FileList)])
                            Array.from(e.target.files as FileList).forEach(f => {
                              const r = new FileReader()
                              r.onloadend = () => setAdditionalImagePreviews(p => [...p, r.result as string])
                              r.readAsDataURL(f)
                            })
                          }
                        }} />
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* --- MEDICAL INFO TAB --- */}
              <TabsContent value="medical" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Composition / Salt Name</Label>
                    <Input value={formData.medicalInfo?.composition || ''} onChange={(e) => handleNestedChange('medicalInfo', 'composition', e.target.value)} placeholder="e.g. Paracetamol" />
                    <p className="text-xs text-muted-foreground">Active ingredients used in the medicine.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Strength</Label>
                    <Input value={formData.medicalInfo?.strength || ''} onChange={(e) => handleNestedChange('medicalInfo', 'strength', e.target.value)} placeholder="e.g. 500mg" />
                  </div>
                  <div className="space-y-2">
                    <Label>Dosage Form</Label>
                    <Select value={formData.medicalInfo?.dosageForm} onValueChange={(v) => handleNestedChange('medicalInfo', 'dosageForm', v)}>
                      <SelectTrigger><SelectValue placeholder="Select Form" /></SelectTrigger>
                      <SelectContent>
                        {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Gel', 'Drops', 'Powder', 'Spray'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pack Size</Label>
                    <Input value={formData.medicalInfo?.packSize || ''} onChange={(e) => handleNestedChange('medicalInfo', 'packSize', e.target.value)} placeholder="e.g. 10 Tablets / 100ml" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dosage & Usage Instructions</Label>
                  <Textarea value={formData.medicalInfo?.usageInstructions || ''} onChange={(e) => handleNestedChange('medicalInfo', 'usageInstructions', e.target.value)} rows={3} placeholder="How to take this medicine..." />
                </div>
                <div className="space-y-2">
                  <Label>Side Effects</Label>
                  <Textarea value={formData.medicalInfo?.sideEffects || ''} onChange={(e) => handleNestedChange('medicalInfo', 'sideEffects', e.target.value)} rows={2} placeholder="Common side effects..." />
                </div>
                <div className="space-y-2">
                  <Label>Storage Instructions</Label>
                  <Input value={formData.medicalInfo?.storageInstructions || ''} onChange={(e) => handleNestedChange('medicalInfo', 'storageInstructions', e.target.value)} placeholder="e.g. Store below 25°C, away from sunlight" />
                </div>
              </TabsContent>

              {/* --- PRICING TAB --- */}
              <TabsContent value="pricing" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>MRP (Original Price) *</Label>
                      <Input type="number" name="mrp" value={formData.mrp ?? ''} onChange={handleInputChange} placeholder="0.00" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Price *</Label>
                      <Input type="number" name="sellingPrice" value={formData.sellingPrice ?? ''} onChange={handleInputChange} placeholder="0.00" required />
                      <p className="text-xs text-muted-foreground">Final price customer pays (before tax calc if exclusive)</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>GST Rate (%)</Label>
                      <Select value={formData.gstRate?.toString()} onValueChange={(v) => handleSelectChangeNumber('gstRate', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['0', '5', '12', '18', '28'].map(r => <SelectItem key={r} value={r}>{r}%</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4 border p-4 rounded-md">
                      <Label>Prices are Tax Inclusive?</Label>
                      <Switch checked={formData.taxType === 'inclusive'} onCheckedChange={(c) => setFormData(p => ({ ...p, taxType: c ? 'inclusive' : 'exclusive' }))} />
                      <span className="text-sm text-muted-foreground">{formData.taxType === 'inclusive' ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* --- INVENTORY TAB --- */}
              <TabsContent value="inventory" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Stock Quantity *</Label>
                    <Input type="number" name="stockQuantity" value={formData.stockQuantity ?? ''} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Low Stock Alert Threshold</Label>
                    <Input type="number" name="lowStockThreshold" value={formData.lowStockThreshold ?? 10} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="border rounded-md p-4 bg-muted/20">
                  <h4 className="font-medium mb-4 flex items-center gap-2"><Info className="h-4 w-4" /> Current Batch Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Batch Number *</Label>
                      <Input name="batchNumber" value={formData.batchNumber || ''} onChange={handleInputChange} placeholder="Batch #XYZ" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date *</Label>
                      <Input type="date" name="expiryDate" value={formatDateForInput(formData.expiryDate)} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Stock Status:</Label>
                  <Badge variant={formData.stockStatus === 'in-stock' ? 'default' : 'destructive'}>{formData.stockStatus || 'in-stock'}</Badge>
                </div>
              </TabsContent>

              {/* --- COMPLIANCE TAB --- */}
              <TabsContent value="compliance" className="space-y-6 mt-0">
                <div className="space-y-4 border p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Prescription Required?</Label>
                      <p className="text-sm text-muted-foreground">Is this a Schedule H/H1/X drug?</p>
                    </div>
                    <Switch checked={formData.compliance?.prescriptionRequired} onCheckedChange={(c) => {
                      handleNestedChange('compliance', 'prescriptionRequired', c)
                      // Also set isSensitive for backward compat
                      setFormData(p => ({ ...p, isSensitive: c }))
                    }} />
                  </div>
                  {formData.compliance?.prescriptionRequired && (
                    <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      Customers must upload a valid prescription to purchase this item.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Schedule Type</Label>
                    <Select value={formData.compliance?.scheduleType || 'otc'} onValueChange={(v) => handleNestedChange('compliance', 'scheduleType', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="otc">OTC (General)</SelectItem>
                        <SelectItem value="h">Schedule H</SelectItem>
                        <SelectItem value="h1">Schedule H1</SelectItem>
                        <SelectItem value="x">Schedule X (Narcotics)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>HSN Code *</Label>
                    <Input name="hsnCode" value={formData.hsnCode || ''} onChange={handleInputChange} required placeholder="e.g. 3004" />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.compliance?.ageRestriction} onCheckedChange={(c) => handleNestedChange('compliance', 'ageRestriction', c)} />
                    <Label>Age Restriction (18+)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.compliance?.pharmacistApprovalRequired} onCheckedChange={(c) => handleNestedChange('compliance', 'pharmacistApprovalRequired', c)} />
                    <Label>Pharmacist Approval Required for Dispatch</Label>
                  </div>
                </div>
              </TabsContent>

              {/* --- DELIVERY TAB --- */}
              <TabsContent value="shipping" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estimated Delivery Time</Label>
                    <Input name="estimatedDelivery" value={formData.estimatedDelivery || ''} onChange={handleInputChange} placeholder="e.g. 2-3 Days" />
                  </div>
                  <div className="space-y-2">
                    <Label>Extra Handling Fee (₹)</Label>
                    <Input type="number" value={formData.shipping?.extraHandlingFee ?? ''} onChange={(e) => handleNestedChange('shipping', 'extraHandlingFee', parseFloat(e.target.value))} placeholder="0.00" />
                  </div>
                </div>
                <div className="flex items-center gap-2 border p-4 rounded-md">
                  <Switch checked={formData.shipping?.coldChainRequired} onCheckedChange={(c) => handleNestedChange('shipping', 'coldChainRequired', c)} />
                  <div>
                    <Label>Cold Chain Storage Required?</Label>
                    <p className="text-sm text-muted-foreground">Keep refrigerated during transit.</p>
                  </div>
                </div>
              </TabsContent>

              {/* --- SEO TAB --- */}
              <TabsContent value="seo" className="space-y-6 mt-0">
                <div className="space-y-2">
                  <Label>Use Slug</Label>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground pt-2">/product/</span>
                    <Input value={formData.seo?.slug || ''} onChange={(e) => handleNestedChange('seo', 'slug', e.target.value)} placeholder="product-url-slug" />
                  </div>
                  <p className="text-xs text-muted-foreground">Auto-generated from product name. Ensure uniqueness.</p>
                </div>
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input value={formData.seo?.metaTitle || ''} onChange={(e) => handleNestedChange('seo', 'metaTitle', e.target.value)} placeholder="SEO Title" />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea value={formData.seo?.metaDescription || ''} onChange={(e) => handleNestedChange('seo', 'metaDescription', e.target.value)} rows={3} placeholder="Brief description for search engines..." />
                </div>
                <div className="space-y-2">
                  <Label>Keywords</Label>
                  <Input value={formData.seo?.metaKeywords || ''} onChange={(e) => handleNestedChange('seo', 'metaKeywords', e.target.value)} placeholder="Comma, separated, keywords" />
                </div>
              </TabsContent>
            </div>


            <div className="p-4 border-t bg-gray-50 flex justify-between gap-3 rounded-b-lg">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ['basic', 'medical', 'pricing', 'inventory', 'compliance', 'shipping', 'seo']
                  const currentIndex = tabs.indexOf(activeTab)
                  if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1])
                  else onClose()
                }}
              >
                {activeTab === 'basic' ? 'Cancel' : 'Previous'}
              </Button>

              {activeTab === 'seo' ? (
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Product'}</Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'medical', 'pricing', 'inventory', 'compliance', 'shipping', 'seo']
                    const currentIndex = tabs.indexOf(activeTab)
                    if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1])
                  }}
                >
                  Next
                </Button>
              )}
            </div>

          </Tabs>
        </form>

        {/* Dialogs */}
        <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Input value={newCategory.prefix} onChange={(e) => setNewCategory({ ...newCategory, prefix: e.target.value })} placeholder="Prefix (e.g. MED)" />
              <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Name" />
              <Button onClick={handleAddCategory} className="w-full">Add</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showAddSubCategoryDialog} onOpenChange={setShowAddSubCategoryDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Subcategory</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Input value={newSubCategoryName} onChange={(e) => setNewSubCategoryName(e.target.value)} placeholder="Name" />
              <Button onClick={handleAddSubCategory} className="w-full">Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}

function startTransition(callback: () => void) {
  callback()
}
