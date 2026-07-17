'use client'

import { useRouter } from 'next/navigation'
import BannerForm from '@/components/banners/banner-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function AddBannerPage() {
    const router = useRouter()

    const handleSuccess = () => {
        router.push('/dashboard/banners')
    }

    const handleCancel = () => {
        router.back()
    }

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add New Banner</h1>
                <p className="text-slate-500 mt-1">Configure banner routing, scheduling, and graphics</p>
            </div>

            <BannerForm
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        </div>
    )
}
