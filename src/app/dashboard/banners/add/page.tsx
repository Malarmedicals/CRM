'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BannerForm from '@/components/banners/banner-form'
import { bannerService } from '@/features/crm/banner-service'
import { Banner } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function AddBannerPage() {
    const router = useRouter()
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)

    const loadBanners = async () => {
        try {
            const data = await bannerService.getBanners()
            setBanners(data)
        } catch (error) {
            console.error('Failed to load banners', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadBanners()
    }, [])

    const handleSuccess = () => {
        loadBanners()
    }

    const handleCancel = () => {
        router.back()
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this banner?')) {
            try {
                await bannerService.deleteBanner(id)
                setBanners(banners.filter(b => b.id !== id))
            } catch (error) {
                console.error('Failed to delete banner', error)
            }
        }
    }

    const handleToggleActive = async (banner: Banner) => {
        try {
            const newState = !banner.isActive
            await bannerService.updateBanner(banner.id, { isActive: newState })
            setBanners(banners.map(b => b.id === banner.id ? { ...b, isActive: newState } : b))
        } catch (error) {
            console.error('Failed to update banner status', error)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Add New Banner</h1>
                <p className="text-muted-foreground mt-1">Create a new banner for the home page</p>
            </div>

            <BannerForm
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />

            <div className="pt-8 border-t">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Active Banners</h2>
                        <p className="text-muted-foreground mt-1">Manage existing banners and sliders</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Banners</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="p-8 text-center">Loading banners...</div>
                        ) : banners.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No banners found.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {banners.map((banner) => (
                                        <TableRow key={banner.id}>
                                            <TableCell>
                                                <div className="relative h-12 w-20 rounded-md overflow-hidden bg-muted">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={banner.image}
                                                        alt={banner.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{banner.title || 'Untitled'}</TableCell>
                                            <TableCell>{banner.category}</TableCell>
                                            <TableCell>{banner.bannerType}</TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={banner.isActive}
                                                    onCheckedChange={() => handleToggleActive(banner)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {banner.createdAt ? formatDate(banner.createdAt) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/dashboard/banners/${banner.id}`}>
                                                        <Button variant="ghost" size="icon">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(banner.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
