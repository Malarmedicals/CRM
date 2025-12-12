import Image from 'next/image'
import { useState } from 'react'
import { Product } from '@/lib/models/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Heart, Package, ChevronLeft, ChevronRight } from 'lucide-react'

import { ecommerceService } from '@/features/ecommerce/ecommerce-service'

interface StoreProductCardProps {
    product: Product
}

export function StoreProductCard({ product }: StoreProductCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isBuying, setIsBuying] = useState(false)

    const allImages = [
        ...(product.primaryImage ? [product.primaryImage] : []),
        ...(product.additionalImages || [])
    ]

    const hasMultipleImages = allImages.length > 1

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
    }

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
    }

    const handleQuickBuy = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsBuying(true)
        try {
            // Demo Order Data
            await ecommerceService.placeOrder(
                'demo-user-id',
                'Demo Customer',
                '+919876543210',
                [{
                    productId: product.id,
                    name: product.name,
                    quantity: 1,
                    price: product.price - product.discount // use effective price
                }]
            )
            alert("Order placed successfully! Check CRM for notification.")
        } catch (error) {
            console.error(error)
            alert("Failed to place order.")
        } finally {
            setIsBuying(false)
        }
    }

    const discountPercentage = product.price && product.discount
        ? Math.round(((product.price - product.discount) / product.price) * 100)
        : 0

    return (
        <Card className="group relative overflow-hidden border-border/50 bg-background transition-all hover:border-primary/50 hover:shadow-lg h-full flex flex-col">
            {/* Image Area */}
            <div className="aspect-[4/5] w-full relative bg-muted/20 overflow-hidden">
                {/* Badges */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
                    {product.stockStatus === 'out-of-stock' && (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white rounded-sm">
                            Sold Out
                        </span>
                    )}
                    {discountPercentage > 0 && product.stockStatus !== 'out-of-stock' && (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-yellow-400 text-black rounded-sm">
                            -{discountPercentage}%
                        </span>
                    )}
                    {product.stockStatus === 'low-stock' && (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white rounded-sm">
                            Low Stock
                        </span>
                    )}
                    {product.isSensitive && (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white rounded-sm flex items-center gap-1">
                            Rx Required
                        </span>
                    )}
                </div>

                {/* Wishlist Button - absolute top right */}
                <button className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300">
                    <Heart className="h-4 w-4" />
                </button>

                {allImages.length > 0 ? (
                    <>
                        <Image
                            src={allImages[currentImageIndex]}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Navigation Arrows */}
                        {hasMultipleImages && (
                            <>
                                <button
                                    onClick={handlePrevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleNextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Package className="h-10 w-10 opacity-20" />
                    </div>
                )}

                {/* Quick Add Button - appears on hover */}
                {product.stockStatus !== 'out-of-stock' && (
                    <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                        <Button
                            className="w-full gap-2 shadow-lg"
                            size="sm"
                            onClick={handleQuickBuy}
                            disabled={isBuying}
                        >
                            {isBuying ? (
                                <span className="animate-spin text-white">⟳</span>
                            ) : (
                                <ShoppingCart className="h-4 w-4" />
                            )}
                            {isBuying ? 'Ordering...' : 'Quick Buy (Demo)'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-1 gap-2">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {product.category}
                </div>
                <h3 className="font-semibold text-base line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors cursor-pointer">
                    {product.name}
                </h3>

                <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="flex flex-col">
                        {product.discount > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">₹{product.discount.toFixed(2)}</span>
                                <span className="text-sm text-muted-foreground line-through">₹{product.price.toFixed(2)}</span>
                            </div>
                        ) : (
                            <span className="font-bold text-lg">₹{product.price.toFixed(2)}</span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}
