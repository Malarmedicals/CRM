import Image from 'next/image'
import { useState } from 'react'
import { Product } from '@/lib/models/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductCardProps {
    product: Product
    onEdit: () => void
    onDelete: () => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // Combine primary and additional images
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

    return (
        <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all bg-white group h-full flex flex-col">
            {/* Image Area */}
            <div className="aspect-video w-full relative bg-gray-100 overflow-hidden group/image">
                {allImages.length > 0 ? (
                    <>
                        <Image
                            src={allImages[currentImageIndex]}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            priority={false}
                        />

                        {/* Navigation Arrows */}
                        {hasMultipleImages && (
                            <>
                                <button
                                    onClick={handlePrevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleNextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>

                                {/* Dots Indicator */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                    {allImages.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 w-1.5 rounded-full shadow-sm transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-10 w-10 text-gray-300" />
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-1">
                {/* Category Badge */}
                <div className="mb-3">
                    <span className="inline-block bg-yellow-400 text-black text-xs font-medium px-2 py-1 rounded-md">
                        {product.category || 'Uncategorized'}
                    </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg mb-1 line-clamp-1 text-gray-900" title={product.name}>
                    {product.name}
                </h3>

                {/* Price & Stock info */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <span className="font-medium text-gray-900">₹{product.price?.toFixed(2)}</span>
                    <span>•</span>
                    <span>{product.stockQuantity} items</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-2">
                    <Button
                        size="sm"
                        onClick={onEdit}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white h-9 px-4 text-xs font-medium"
                    >
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        onClick={onDelete}
                        className="bg-red-500 hover:bg-red-600 text-white h-9 px-4 text-xs font-medium"
                    >
                        Delete
                    </Button>

                    <div className="ml-auto">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${product.stockQuantity === 0 ? 'text-red-500' :
                            product.stockQuantity < 10 ? 'text-orange-500' : 'text-green-500'
                            }`}>
                            {product.stockQuantity === 0 ? 'No Stock' :
                                product.stockQuantity < 10 ? 'Low Stock' : 'Active'}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    )
}
