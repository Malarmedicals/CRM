'use client'

import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import type { Banner } from '@/features/crm/domain/types'
import type { Product } from '@/features/products/domain/types'
import { bannerService } from '@/features/crm'
import { productService } from '@/features/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, X, Image as ImageIcon } from 'lucide-react'
import { getCroppedImg } from '@/lib/utils/cropImage'
import { formatDate } from '@/lib/utils/format'

interface BannerFormProps {
    onSuccess: () => void
    onCancel: () => void
    initialData?: Banner
}

const POSITIONS = ['TOP', 'MIDDLE', 'BOTTOM', 'BLOG']

const REDIRECT_TYPES = ['None', 'Internal Page', 'External URL', 'Product', 'Category', 'Brand', 'Offer']

const ASPECT_RATIOS: Record<string, number> = {
    'TOP': 21 / 9,
    'MIDDLE': 32 / 9,
    'BOTTOM': 32 / 9,
    'BLOG': 32 / 9,
    'HOME_HERO': 21 / 9,
    'HOME_MIDDLE': 32 / 9,
    'HOME_BOTTOM': 32 / 9,
}

export default function BannerForm({ onSuccess, onCancel, initialData }: BannerFormProps) {
    const [formData, setFormData] = useState<Partial<Banner>>({
        name: initialData?.name || '',
        position: initialData?.position || '',
        displayOrder: initialData?.displayOrder || 1,
        status: initialData?.status || 'Active',
        redirectType: initialData?.redirectType || 'None',
        redirectTarget: initialData?.redirectTarget || '',
        openIn: initialData?.openIn || 'Same Tab',
        startDate: initialData?.startDate,
        endDate: initialData?.endDate,
        altText: initialData?.altText || '',
        image: initialData?.image || ''
    })

    const [imageSrc, setImageSrc] = useState<string | null>(initialData?.image || null)
    const [isNewImage, setIsNewImage] = useState(false)

    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Data for dropdowns
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [brands, setBrands] = useState<string[]>([])

    useEffect(() => {
        const loadData = async () => {
            try {
                const allProducts = await productService.getAllProducts()
                setProducts(allProducts)

                const cats = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean))) as string[]
                setCategories(cats.sort())

                const brs = Array.from(new Set(allProducts.map(p => p.brandName).filter(Boolean))) as string[]
                setBrands(brs.sort())
            } catch (err) {
                console.error('Failed to load products/categories:', err)
            }
        }
        loadData()
    }, [])

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string)
                setIsNewImage(true)
            })
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (!formData.name) throw new Error('Banner Name is required')
            if (!formData.position) throw new Error('Banner Position is required')
            if (!imageSrc && !formData.image) throw new Error('Banner Image is required')

            if (formData.redirectType === 'External URL' && formData.redirectTarget) {
                try {
                    new URL(formData.redirectTarget.trim())
                } catch {
                    throw new Error('Please enter a valid External URL (e.g., https://example.com)')
                }
            }

            let imageUrl = formData.image

            if (isNewImage && imageSrc && croppedAreaPixels) {
                const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
                if (!croppedImageBlob) throw new Error('Failed to crop image')

                const filename = `banners/${Date.now()}.jpg`
                imageUrl = await bannerService.uploadImage(croppedImageBlob, filename)
            } else if (!imageUrl) {
                throw new Error('Please upload an image')
            }

            const bannerData = {
                ...formData,
                displayOrder: Number(formData.displayOrder) || 0,
                redirectTarget: formData.redirectType === 'None' ? '' : formData.redirectTarget?.trim(),
                image: imageUrl,
            }

            if (initialData?.id) {
                await bannerService.updateBanner(initialData.id, bannerData)
            } else {
                await bannerService.addBanner(bannerData)
            }

            onSuccess()
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to save banner')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in pb-10">
            {/* Section 1: Basic Information */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>1. Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Banner Name *</Label>
                        <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Summer Sale 2026"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="position">Banner Position *</Label>
                        <Select
                            value={formData.position}
                            onValueChange={(val) => setFormData({ ...formData, position: val })}
                        >
                            <SelectTrigger id="position">
                                <SelectValue placeholder="Select Position" />
                            </SelectTrigger>
                            <SelectContent>
                                {POSITIONS.map(pos => (
                                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Section 2: Navigation */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>2. Navigation</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="redirectType">Redirect Type *</Label>
                        <Select
                            value={formData.redirectType}
                            onValueChange={(val) => setFormData({ ...formData, redirectType: val, redirectTarget: '' })}
                        >
                            <SelectTrigger id="redirectType">
                                <SelectValue placeholder="Select Redirect Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {REDIRECT_TYPES.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="redirectTarget">Redirect Target</Label>
                        {formData.redirectType === 'None' ? (
                            <Input value="" disabled placeholder="No redirect" />
                        ) : formData.redirectType === 'External URL' ? (
                            <Input 
                                value={formData.redirectTarget || ''} 
                                onChange={e => setFormData({ ...formData, redirectTarget: e.target.value })} 
                                placeholder="https://..." 
                            />
                        ) : formData.redirectType === 'Internal Page' ? (
                            <Input 
                                value={formData.redirectTarget || ''} 
                                onChange={e => setFormData({ ...formData, redirectTarget: e.target.value })} 
                                placeholder="e.g. /offers" 
                            />
                        ) : formData.redirectType === 'Product' ? (
                            <Select value={formData.redirectTarget} onValueChange={v => setFormData({ ...formData, redirectTarget: v })}>
                                <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                                <SelectContent>
                                    {products.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : formData.redirectType === 'Category' ? (
                            <Select value={formData.redirectTarget} onValueChange={v => setFormData({ ...formData, redirectTarget: v })}>
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : formData.redirectType === 'Brand' ? (
                            <Select value={formData.redirectTarget} onValueChange={v => setFormData({ ...formData, redirectTarget: v })}>
                                <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                                <SelectContent>
                                    {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input 
                                value={formData.redirectTarget || ''} 
                                onChange={e => setFormData({ ...formData, redirectTarget: e.target.value })} 
                                placeholder="Target ID or Name" 
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="openIn">Open Link In</Label>
                        <Select
                            value={formData.openIn}
                            onValueChange={(val) => setFormData({ ...formData, openIn: val })}
                        >
                            <SelectTrigger id="openIn">
                                <SelectValue placeholder="Select Tab Behavior" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Same Tab">Same Tab</SelectItem>
                                <SelectItem value="New Tab">New Tab</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Section 3: Scheduling */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>3. Scheduling (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                            id="startDate"
                            type="datetime-local"
                            value={formData.startDate ? new Date(formData.startDate.getTime() - formData.startDate.getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value ? new Date(e.target.value) : undefined })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                            id="endDate"
                            type="datetime-local"
                            value={formData.endDate ? new Date(formData.endDate.getTime() - formData.endDate.getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value) : undefined })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Section 4: Banner Image */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>4. Banner Image *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!isNewImage && imageSrc ? (
                        <div className="space-y-4">
                            <Label className="text-muted-foreground">Desktop & Mobile Preview</Label>
                            <div className="relative group rounded-xl overflow-hidden border" style={{ aspectRatio: ASPECT_RATIOS[formData.position || 'TOP'] || (21/9) }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imageSrc} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setImageSrc(null)
                                            setIsNewImage(true)
                                        }}
                                    >
                                        Change Image
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : !imageSrc ? (
                        <div className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:bg-muted/50 transition-all duration-200 cursor-pointer group">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="image-upload"
                            />
                            <Label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                <div className="p-4 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">Click to upload image</span>
                                    <p className="text-sm text-muted-foreground">or drag and drop here</p>
                                </div>
                                <span className="text-xs text-muted-foreground/80">SVG, PNG, JPG or GIF (max. 5MB)</span>
                            </Label>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-slide-up">
                            <div className="relative w-full bg-black/5 rounded-xl overflow-hidden ring-1 ring-border shadow-inner" style={{ aspectRatio: ASPECT_RATIOS[formData.position || 'TOP'] || (21/9) }}>
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={ASPECT_RATIOS[formData.position || 'TOP'] || (21/9)}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>
                            <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-xl border">
                                <span className="text-sm font-medium w-12 text-muted-foreground">Zoom</span>
                                <Slider
                                    value={[zoom]}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onValueChange={(value) => setZoom(value[0])}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => setImageSrc(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Section 5: Accessibility */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>5. Accessibility</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="altText">Alt Text (Recommended)</Label>
                        <Input
                            id="altText"
                            value={formData.altText || ''}
                            onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                            placeholder="Description for screen readers"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Section 6: Metadata (Read Only) */}
            {initialData && (
                <Card className="shadow-sm bg-slate-50/50">
                    <CardHeader>
                        <CardTitle className="text-slate-700">6. Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                        <div><strong className="text-slate-800">Created:</strong> {initialData.createdAt ? formatDate(initialData.createdAt) : '-'}</div>
                        <div><strong className="text-slate-800">Updated:</strong> {initialData.updatedAt ? formatDate(initialData.updatedAt) : '-'}</div>
                    </CardContent>
                </Card>
            )}

            {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Banner
                </Button>
            </div>
        </form>
    )
}
