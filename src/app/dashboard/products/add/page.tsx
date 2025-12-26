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
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
                <p className="text-muted-foreground mt-1">Create a new product listing</p>
            </div>

            <ProductForm
                onClose={handleClose}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
