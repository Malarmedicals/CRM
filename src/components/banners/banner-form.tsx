'use client'

import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { Banner, Product } from '@/lib/models/types'
import { bannerService } from '@/features/crm/banner-service'
import { productService } from '@/features/products/product-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Upload, X, Bold, Italic, Underline, List, ListOrdered, Image as ImageIcon } from 'lucide-react'
import { getCroppedImg } from '@/lib/utils/cropImage'

interface BannerFormProps {
    onSuccess: () => void
    onCancel: () => void
}

export default function BannerForm({ onSuccess, onCancel }: BannerFormProps) {
    const [formData, setFormData] = useState<Partial<Banner>>({
        title: '',
        mainCategory: '',
        categoryTag: '',
        showCategoryTag: false,
        priceDisplay: '',
        description: '',
        seoTitle: '',
        seoDescription: '',
        linkProductId: '',
        bannerType: 'Single Banner',
        isActive: true,
        image: ''
    })

    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Data for dropdowns
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<string[]>([])

    useEffect(() => {
        const loadData = async () => {
            try {
                const allProducts = await productService.getAllProducts()
                setProducts(allProducts)

                // Extract unique categories
                const cats = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean)))
                setCategories(cats.sort())
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
            reader.addEventListener('load', () => setImageSrc(reader.result as string))
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (!imageSrc || !croppedAreaPixels) {
                throw new Error('Please upload and crop an image')
            }

            if (!formData.mainCategory) throw new Error('Main Category is required')
            if (!formData.linkProductId) throw new Error('Linked Product is required')

            // 1. Get cropped image blob
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (!croppedImageBlob) throw new Error('Failed to crop image')

            // 2. Upload image
            const filename = `banners/${Date.now()}.jpg`
            const imageUrl = await bannerService.uploadImage(croppedImageBlob, filename)

            // 3. Find full product link/details if needed, but we store ID
            // We can also construct a link url from product ID
            const selectedProduct = products.find(p => p.id === formData.linkProductId)
            const linkUrl = selectedProduct ? `/products/${selectedProduct.id}` : ''

            // 4. Save banner data
            await bannerService.addBanner({
                title: formData.title || '',
                mainCategory: formData.mainCategory,
                categoryTag: formData.categoryTag || '',
                showCategoryTag: formData.showCategoryTag || false,
                priceDisplay: formData.priceDisplay || '',
                description: formData.description || '',
                seoTitle: formData.seoTitle || '',
                seoDescription: formData.seoDescription || '',
                linkProductId: formData.linkProductId,
                link: linkUrl, // Backward compatibility or actual link usage
                bannerType: formData.bannerType as any,
                isActive: formData.isActive || false,
                image: imageUrl,
            })

            onSuccess()
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to save banner')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="p-6 max-w-5xl mx-auto shadow-sm animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Row 1: Title, Category stuff */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                    <div className="space-y-2">
                        <Label htmlFor="title">Banner Title (Optional)</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Summer Sale"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mainCategory">Main Category *</Label>
                        <Select
                            value={formData.mainCategory}
                            onValueChange={(val) => setFormData({ ...formData, mainCategory: val })}
                        >
                            <SelectTrigger id="mainCategory">
                                <SelectValue placeholder="Select Main Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="categoryTag">Category Tag</Label>
                        <Input
                            id="categoryTag"
                            value={formData.categoryTag}
                            onChange={(e) => setFormData({ ...formData, categoryTag: e.target.value })}
                            placeholder="e.g., Products Essentials"
                        />
                    </div>

                    <div className="flex flex-col justify-end h-full pb-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="showCategoryTag"
                                checked={formData.showCategoryTag}
                                onCheckedChange={(checked) => setFormData({ ...formData, showCategoryTag: checked as boolean })}
                            />
                            <Label htmlFor="showCategoryTag" className="cursor-pointer font-normal text-muted-foreground">Show Category Tag</Label>
                        </div>
                    </div>
                </div>

                {/* Row 2: Price */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="priceDisplay">Price Display (Optional)</Label>
                        <Input
                            id="priceDisplay"
                            value={formData.priceDisplay}
                            onChange={(e) => setFormData({ ...formData, priceDisplay: e.target.value })}
                            placeholder="e.g., $196.98"
                        />
                    </div>
                </div>

                {/* Row 3: Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <div className="border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden">
                        <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Italic className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Underline className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-4 bg-border mx-2" />
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <List className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <ListOrdered className="h-4 w-4" />
                            </Button>
                        </div>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter banner description..."
                            className="border-0 focus-visible:ring-0 min-h-[120px] resize-y rounded-none"
                        />
                    </div>
                </div>

                {/* Row 4: SEO & Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="seoTitle">SEO Title</Label>
                        <Input
                            id="seoTitle"
                            value={formData.seoTitle}
                            onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                            placeholder="SEO optimized title (50-60 characters)"
                        />
                        <div className="text-xs text-muted-foreground text-right">{formData.seoTitle?.length || 0}/60</div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="seoDescription">SEO Description</Label>
                        <Textarea
                            id="seoDescription"
                            value={formData.seoDescription}
                            onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                            placeholder="SEO meta description (150-160 characters)"
                            rows={3}
                        />
                        <div className="text-xs text-muted-foreground text-right">{formData.seoDescription?.length || 0}/160</div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="linkProductId">Link Product *</Label>
                        <Select
                            value={formData.linkProductId}
                            onValueChange={(val) => setFormData({ ...formData, linkProductId: val })}
                        >
                            <SelectTrigger id="linkProductId">
                                <SelectValue placeholder="Search product by name..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bannerType">Banner Type</Label>
                        <Select
                            value={formData.bannerType}
                            onValueChange={(val) => setFormData({ ...formData, bannerType: val as any })}
                        >
                            <SelectTrigger id="bannerType">
                                <SelectValue placeholder="Select Banner Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Single Banner">Single Banner</SelectItem>
                                <SelectItem value="Slider">Slider</SelectItem>
                                <SelectItem value="Grid">Grid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Image Section */}
                <div className="space-y-3 pt-4 border-t">
                    <Label className="text-base font-semibold">Banner Image *</Label>
                    {!imageSrc ? (
                        <div className="mt-2 border-2 border-dashed border-border rounded-xl p-10 text-center hover:bg-muted/50 transition-all duration-200 cursor-pointer group">
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
                        <div className="mt-2 space-y-4 animate-slide-up">
                            <div className="relative h-[300px] w-full bg-black/5 rounded-xl overflow-hidden ring-1 ring-border shadow-inner">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={16 / 9}
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
                </div>

                {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Banner
                    </Button>
                </div>
            </form>
        </Card>
    )
}
