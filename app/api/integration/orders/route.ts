import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/lib/services/order-service'
import { productService } from '@/lib/services/product-service'
import { Timestamp } from 'firebase/firestore'

// Verify API key middleware
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  return apiKey === process.env.INTEGRATION_API_KEY
}

// POST /api/integration/orders - Create order from e-commerce
export async function POST(request: NextRequest) {
  try {
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, products, totalAmount, prescriptionVerified } = body

    // Validate required fields
    if (!userId || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, products' },
        { status: 400 }
      )
    }

    // Verify products exist and check stock
    for (const item of products) {
      const product = await productService.getAllProducts().then(products => 
        products.find(p => p.id === item.productId)
      )
      
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        )
      }

      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product ${product.name}` },
          { status: 400 }
        )
      }
    }

    // Create order
    const orderId = await orderService.createOrder({
      userId,
      products,
      totalAmount: totalAmount || products.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'pending',
      prescriptionVerified: prescriptionVerified || false,
    })

    // Update product stock
    for (const item of products) {
      const product = await productService.getAllProducts().then(products => 
        products.find(p => p.id === item.productId)
      )
      if (product) {
        await productService.updateProduct(item.productId, {
          stockQuantity: product.stockQuantity - item.quantity,
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      orderId,
      message: 'Order created successfully' 
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

// GET /api/integration/orders - Get orders (with optional filters)
export async function GET(request: NextRequest) {
  try {
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    let orders = await orderService.getAllOrders()

    // Apply filters
    if (userId) {
      orders = orders.filter(order => order.userId === userId)
    }
    if (status) {
      orders = orders.filter(order => order.status === status)
    }

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

