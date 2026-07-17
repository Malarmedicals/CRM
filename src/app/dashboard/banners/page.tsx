'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { bannerService } from '@/features/crm'
import type { Banner } from '@/features/crm/domain/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function BannersPage() {
    const router = useRouter()
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, id: string, name: string }>({ open: false, id: '', name: '' })

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

    const handleDelete = (id: string, name: string) => {
        setDeleteConfirm({ open: true, id, name })
    }

    const confirmDelete = async () => {
        try {
            await bannerService.deleteBanner(deleteConfirm.id)
            setBanners(banners.filter(b => b.id !== deleteConfirm.id))
        } catch (error) {
            console.error('Failed to delete banner', error)
        } finally {
            setDeleteConfirm(prev => ({ ...prev, open: false }))
        }
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default'
            case 'Draft': return 'secondary'
            case 'Scheduled': return 'outline'
            case 'Expired': return 'destructive'
            case 'Archived': return 'secondary'
            default: return 'outline'
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Loading banners...</div>
    }

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Banners</h1>
                    <p className="text-slate-500 mt-1">Manage graphical routing banners across the eCommerce platform</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={() => router.push('/dashboard/banners/add')}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Add Banner
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                    <CardTitle className="text-lg text-slate-800">All Banners</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {banners.length === 0 ? (
                        <div className="text-center py-16 text-slate-500 flex flex-col items-center">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Plus className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-lg font-medium text-slate-600">No banners found</p>
                            <p className="text-sm">Create a new banner to route customers to specific pages or products.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[120px]">Thumbnail</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Order</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {banners.map((banner) => (
                                    <TableRow key={banner.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="relative h-12 w-28 rounded overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={banner.image}
                                                    alt={banner.altText || banner.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">{banner.name || 'Untitled'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 whitespace-nowrap">
                                                {banner.position?.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(banner.status)}>
                                                {banner.status || 'Draft'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-slate-500">{banner.displayOrder || 0}</TableCell>
                                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                                            {banner.startDate ? formatDate(banner.startDate) : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                                            {banner.endDate ? formatDate(banner.endDate) : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                                            {banner.updatedAt ? formatDate(banner.updatedAt) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                                    onClick={() => router.push(`/dashboard/banners/${banner.id}`)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(banner.id, banner.name || 'Untitled')}
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

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900">Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-slate-600 text-sm">
                        <p>Are you sure you want to delete the banner <strong className="text-slate-900">{deleteConfirm.name}</strong>?</p>
                        <p className="mt-2">This action cannot be undone.</p>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
