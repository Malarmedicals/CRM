'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import BannerForm from '@/components/banners/banner-form'
import { bannerService } from '@/features/crm/banner-service'
import { Banner } from '@/lib/models/types'

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const [banner, setBanner] = useState<Banner | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadBanner = async () => {
            try {
                const data = await bannerService.getBannerById(id)
                if (!data) {
                    router.push('/dashboard/banners')
                    return
                }
                setBanner(data)
            } catch (error) {
                console.error('Failed to load banner', error)
                router.push('/dashboard/banners')
            } finally {
                setLoading(false)
            }
        }
        loadBanner()
    }, [id, router])

    const handleSuccess = () => {
        router.push('/dashboard/banners')
    }

    const handleCancel = () => {
        router.push('/dashboard/banners')
    }

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>
    }

    if (!banner) return null

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Edit Banner</h1>
                <p className="text-muted-foreground mt-1">Update banner details</p>
            </div>

            <BannerForm
                initialData={banner}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        </div>
    )
}
