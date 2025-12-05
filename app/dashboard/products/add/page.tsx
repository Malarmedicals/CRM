'use client'

import { useRouter } from 'next/navigation'
import ProductForm from '@/components/products/product-form'

export default function AddProductPage() {
    const router = useRouter()

    const handleClose = () => {
        router.push('/dashboard/products')
    }

    const handleSuccess = () => {
        router.push('/dashboard/products')
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Add New Product</h1>
                <p className="text-muted-foreground mt-1">Create a new product listing</p>
            </div>

            <ProductForm
                onClose={handleClose}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
