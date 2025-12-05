'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Banner } from '@/lib/models/types'
import { bannerService } from '@/lib/services/banner-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Loader2, Upload, X } from 'lucide-react'
import { getCroppedImg } from '@/lib/utils/cropImage'

interface BannerFormProps {
    onSuccess: () => void
    onCancel: () => void
}

export default function BannerForm({ onSuccess, onCancel }: BannerFormProps) {
    const [formData, setFormData] = useState<Partial<Banner>>({
        title: '',
        link: '',
        seoDescription: '',
        isActive: true,
    })
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

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

            // 1. Get cropped image blob
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (!croppedImageBlob) throw new Error('Failed to crop image')

            // 2. Upload image
            const filename = `banners/${Date.now()}.jpg`
            const imageUrl = await bannerService.uploadImage(croppedImageBlob, filename)

            // 3. Save banner data
            await bannerService.addBanner({
                title: formData.title || '',
                link: formData.link || '',
                seoDescription: formData.seoDescription || '',
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
        <Card className="p-6 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="title">Banner Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Summer Sale"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="link">Link URL</Label>
                        <Input
                            id="link"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            placeholder="e.g., /products/summer-collection"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="seoDescription">SEO Description</Label>
                        <Textarea
                            id="seoDescription"
                            value={formData.seoDescription}
                            onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                            placeholder="Description for search engines..."
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label htmlFor="isActive">Active</Label>
                    </div>

                    <div>
                        <Label>Banner Image</Label>
                        {!imageSrc ? (
                            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <Label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Click to upload image</span>
                                </Label>
                            </div>
                        ) : (
                            <div className="mt-2 space-y-4">
                                <div className="relative h-64 w-full bg-black rounded-lg overflow-hidden">
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
                                <div className="flex items-center gap-4">
                                    <span className="text-sm w-12">Zoom</span>
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
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setImageSrc(null)}
                                        className="text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex justify-end gap-2">
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
