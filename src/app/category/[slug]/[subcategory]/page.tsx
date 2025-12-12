'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { categoryService } from '@/features/categories/category-service'
import { productService } from '@/features/products/product-service'
import { Product } from '@/lib/models/types'
import { StoreProductCard } from '@/components/store/store-product-card'
import { Navigation } from '@/components/layout/navigation'

export default function SubCategoryPage() {
    const params = useParams()
    const slug = params?.slug as string
    const subSlug = params?.subcategory as string // "sub-category-slug"

    const [products, setProducts] = useState<Product[]>([])
    const [categoryName, setCategoryName] = useState<string>('')
    const [subCategoryName, setSubCategoryName] = useState<string>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            if (!slug || !subSlug) return

            try {
                // 1. Resolve Category Name from Slug
                const categories = await categoryService.getAllCategories()
                const category = categories.find(c => c.id === slug)
                const mainCatName = category ? category.name : slug.replace(/-/g, ' ')

                setCategoryName(mainCatName)

                // 2. Resolve Subcategory Name from SubSlug
                // We look inside the category's subcategories list to find the one that matches the slug
                let targetSubName = subSlug.replace(/-/g, ' ') // fallback
                if (category && category.subcategories) {
                    const match = category.subcategories.find(
                        sub => sub.toLowerCase().replace(/\s+/g, '-') === subSlug
                    )
                    if (match) targetSubName = match
                }
                setSubCategoryName(targetSubName)

                // 3. Fetch products for Main Category, then filter by Subcategory
                // Client-side filtering avoids complex Firestore composite indexes for now
                const catProducts = await productService.getProductsByCategory(mainCatName)
                const filtered = catProducts.filter(p => p.subcategory === targetSubName)

                setProducts(filtered)

            } catch (err) {
                console.error('Failed to load subcategory data:', err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [slug, subSlug])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navigation />
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-slate-200 w-1/3 rounded"></div>
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{categoryName}</span>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">{subCategoryName}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 capitalize mb-2">{subCategoryName}</h1>
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
                        <p className="text-slate-400 text-lg">No products found in {subCategoryName}.</p>
                        <p className="text-slate-400/80 text-sm mt-1">Try browsing other categories.</p>
                    </div>
                )}
            </main>
        </div>
    )
}
