'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { categoryService } from '@/features/categories/category-service'
import { productService } from '@/features/products/product-service'
import { Product } from '@/lib/models/types'
import { StoreProductCard } from '@/components/store/store-product-card'
import { Navigation } from '@/components/layout/navigation'

export default function CategoryPage() {
    const params = useParams()
    const slug = params?.slug as string

    const [products, setProducts] = useState<Product[]>([])
    const [categoryName, setCategoryName] = useState<string>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            if (!slug) return

            try {
                // 1. Fetch all categories to find the one matching the slug (ID)
                // Note: direct doc fetch by ID (slug) is better if ID is guaranteed to be slug
                const categories = await categoryService.getAllCategories()
                const category = categories.find(c => c.id === slug)

                const name = category ? category.name : slug.replace(/-/g, ' ') // Fallback to un-slugifying
                setCategoryName(name)

                // 2. Fetch products for this category
                // Note: productService.getProductsByCategory expects the Exact String Name stored in DB
                const allProducts = await productService.getProductsByCategory(name)
                setProducts(allProducts)

            } catch (err) {
                console.error('Failed to load category data:', err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navigation />
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-slate-200 w-1/4 rounded"></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-[4/5] bg-slate-200 rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navigation />

            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 capitalize mb-2">{categoryName}</h1>
                    <p className="text-slate-500">
                        {products.length} {products.length === 1 ? 'product' : 'products'} found
                    </p>
                </div>

                {/* Product Grid */}
                {products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map(product => (
                            <StoreProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                        <p className="text-slate-400 text-lg">No products found in this category.</p>
                        <p className="text-slate-400/80 text-sm mt-1">Try browsing other categories.</p>
                    </div>
                )}
            </main>
        </div>
    )
}
