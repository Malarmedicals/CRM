import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/lib/services/order-service'
import { productService } from '@/lib/services/product-service'
import { leadService } from '@/lib/services/lead-service'

// Verify webhook signature
function verifyWebhook(request: NextRequest): boolean {
  const signature = request.headers.get('x-webhook-signature')
  const expectedSignature = process.env.WEBHOOK_SECRET
  return signature === expectedSignature
}

// POST /api/integration/webhooks - Handle webhooks from e-commerce
export async function POST(request: NextRequest) {
  try {
    if (!verifyWebhook(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event, data } = body

    switch (event) {
      case 'order.created':
        // E-commerce created an order - sync to CRM
        await orderService.createOrder({
          userId: data.userId,
          products: data.products,
          totalAmount: data.totalAmount,
          status: 'pending',
          prescriptionVerified: data.prescriptionVerified || false,
        })
        break

      case 'order.updated':
        // E-commerce updated order status
        if (data.orderId) {
          await orderService.updateOrder(data.orderId, {
            status: data.status,
            dispatchTracking: data.dispatchTracking,
          })
        }
        break

      case 'product.stock.updated':
        // E-commerce updated product stock
        if (data.productId && data.quantity !== undefined) {
          const products = await productService.getAllProducts()
          const product = products.find(p => p.id === data.productId)
          if (product) {
            let stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock'
            if (data.quantity === 0) {
              stockStatus = 'out-of-stock'
            } else if (data.quantity < 10) {
              stockStatus = 'low-stock'
            }
            await productService.updateProduct(data.productId, {
              stockQuantity: data.quantity,
              stockStatus,
            })
          }
        }
        break

      case 'lead.created':
        // E-commerce contact form submission
        await leadService.createLead({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          stage: 'new',
          priority: 'medium',
          notes: data.message || '',
        })
        break

      default:
        return NextResponse.json(
          { error: `Unknown event type: ${event}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      success: true,
      message: `Webhook ${event} processed successfully` 
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

