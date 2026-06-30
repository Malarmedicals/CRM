'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ProductForm from '@/features/products/product-form'
import { productService } from '@/features/products'
import type { Product } from '@/features/products/domain/types'

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProduct = async () => {
            if (params.id) {
                try {
                    const data = await productService.getProductById(params.id as string)
                    setProduct(data)
                } catch (error) {
                    console.error('Failed to load product:', error)
                } finally {
                    setLoading(false)
                }
            }
        }
        fetchProduct()
    }, [params.id])

    const handleClose = () => {
        router.push('/dashboard/products')
    }

    const handleSuccess = () => {
        router.push('/dashboard/products')
    }

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading product data...</div>
    }

    if (!product) {
        return <div className="p-8 text-center text-muted-foreground">Product not found.</div>
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
                <p className="text-muted-foreground mt-1">Update existing product listing</p>
            </div>

            <ProductForm
                product={product}
                onClose={handleClose}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
