'use client'

import { useRouter } from 'next/navigation'
import ProductForm from '@/features/products/product-form'

export default function AddProductPage() {
    const router = useRouter()

    const handleClose = () => {
        router.push('/dashboard/products')
    }

    const handleSuccess = () => {
        router.push('/dashboard/products')
    }

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add New Product</h1>
                <p className="text-slate-500 mt-1">Create a new product listing</p>
            </div>

            <ProductForm
                onClose={handleClose}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
