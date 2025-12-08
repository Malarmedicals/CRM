'use client'

import { useRouter } from 'next/navigation'
import BannerForm from '@/components/banners/banner-form'

export default function AddBannerPage() {
    const router = useRouter()

    const handleSuccess = () => {
        // Redirect to banners list or dashboard after success
        // Since we don't have a banners list page yet, we'll go to dashboard
        router.push('/dashboard')
    }

    const handleCancel = () => {
        router.back()
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Add New Banner</h1>
                <p className="text-muted-foreground mt-1">Create a new banner for the home page</p>
            </div>

            <BannerForm
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        </div>
    )
}
