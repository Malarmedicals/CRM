'use client'

import { useState, useEffect } from 'react'
import { productService } from '@/features/products/product-service'
import { Product } from '@/lib/models/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, AlertTriangle, Package } from 'lucide-react'

interface MedicineSelectorProps {
    onSelect: (product: Product) => void
}

export function MedicineSelector({ onSelect }: MedicineSelectorProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    // Debounced Server-side search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length < 2) {
                setResults([])
                setHasSearched(false)
                return
            }

            setLoading(true)
            setHasSearched(true)
            try {
                // Try searching with capitalized first letter (common for medicines)
                const term = query
                const capitalizedTerm = term.charAt(0).toUpperCase() + term.slice(1)

                let searchResults = await productService.searchProducts(capitalizedTerm)

                // If no results and term is different (e.g. user typed lowercase 'ind' -> 'Ind' failed),
                // try searching exactly as typed (concerns cases like 'iPhone' or lowercase db entries)
                if (searchResults.length === 0 && term !== capitalizedTerm) {
                    searchResults = await productService.searchProducts(term)
                }

                // If still no results, maybe try uppercase? (e.g. 'DOLO')
                if (searchResults.length === 0 && term !== term.toUpperCase()) {
                    const upperResults = await productService.searchProducts(term.toUpperCase())
                    searchResults = upperResults
                }

                setResults(searchResults)
            } catch (error) {
                console.error('Search failed:', error)
                setResults([])
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    return (
        <div className="relative w-full">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search medicine database..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-8"
                />
                {loading && (
                    <div className="absolute right-3 top-3">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                )}
            </div>

            {query.length >= 2 && (results.length > 0 || (hasSearched && !loading)) && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {results.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No medicines found for "{query}"
                        </div>
                    ) : (
                        results.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => {
                                    onSelect(product)
                                    setQuery('')
                                    setResults([])
                                    setHasSearched(false)
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0 flex justify-between items-center group bg-white"
                            >
                                <div>
                                    <p className="font-medium text-sm text-gray-900 group-hover:text-primary">
                                        {product.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 rounded-sm">
                                            {product.category}
                                        </Badge>
                                        <span>₹{product.price}</span>
                                        <span>•</span>
                                        <span>Stock: {product.stockQuantity}</span>
                                    </div>
                                </div>

                                {product.stockQuantity < 10 && (
                                    <div className="flex items-center text-orange-600 mr-2" title="Low Stock">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                )}
                                {product.stockQuantity === 0 && (
                                    <div className="flex items-center text-red-600 mr-2" title="Out of Stock">
                                        <Package className="h-4 w-4" />
                                    </div>
                                )}

                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="h-4 w-4" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
