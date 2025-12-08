import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/features/products/product-service'

// Verify API key middleware
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  return apiKey === process.env.INTEGRATION_API_KEY
}

// GET /api/integration/products - Get products for e-commerce
export async function GET(request: NextRequest) {
  try {
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const inStockOnly = searchParams.get('inStockOnly') === 'true'

    let products = category
      ? await productService.getProductsByCategory(category)
      : await productService.getAllProducts()

    // Filter out-of-stock products if requested
    if (inStockOnly) {
      products = products.filter(p => p.stockQuantity > 0 && p.stockStatus !== 'out-of-stock')
    }

    // Format for e-commerce (remove internal fields, add public fields)
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      discount: product.discount,
      finalPrice: product.price - (product.price * product.discount) / 100,
      category: product.category,
      subcategory: product.subcategory,
      stockQuantity: product.stockQuantity,
      stockStatus: product.stockStatus,
      images: product.images,
      primaryImage: product.primaryImage,
      brandName: product.brandName,
      estimatedDelivery: product.estimatedDelivery,
      freeShippingThreshold: product.freeShippingThreshold,
      // Exclude internal fields like batchNumber, expiryDate, etc.
    }))

    return NextResponse.json({ products: formattedProducts }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// PUT /api/integration/products/[id]/stock - Update product stock
export async function PUT(request: NextRequest) {
  try {
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, quantity, operation } = body // operation: 'set' | 'increment' | 'decrement'

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, quantity' },
        { status: 400 }
      )
    }

    const products = await productService.getAllProducts()
    const product = products.find(p => p.id === productId)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    let newQuantity = product.stockQuantity
    if (operation === 'set') {
      newQuantity = quantity
    } else if (operation === 'increment') {
      newQuantity = product.stockQuantity + quantity
    } else if (operation === 'decrement') {
      newQuantity = Math.max(0, product.stockQuantity - quantity)
    } else {
      newQuantity = quantity // Default to set
    }

    // Update stock status based on quantity
    let stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock'
    if (newQuantity === 0) {
      stockStatus = 'out-of-stock'
    } else if (newQuantity < 10) {
      stockStatus = 'low-stock'
    }

    await productService.updateProduct(productId, {
      stockQuantity: newQuantity,
      stockStatus,
    })

    return NextResponse.json({
      success: true,
      productId,
      stockQuantity: newQuantity,
      stockStatus,
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update product stock' },
      { status: 500 }
    )
  }
}

