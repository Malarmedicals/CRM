import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/features/orders'
import { productService } from '@/features/products'
import { leadService } from '@/features/crm'

import crypto from 'crypto'

// In-memory idempotency cache (in production, use Redis or a DB table)
const processedWebhooks = new Set<string>()

// Verify webhook signature, replay protection, and idempotency
async function verifyWebhook(request: NextRequest, rawBody: string): Promise<{ valid: boolean, error?: string }> {
  const signatureHeader = request.headers.get('x-webhook-signature')
  const idempotencyKey = request.headers.get('x-idempotency-key')
  const secret = process.env.WEBHOOK_SECRET

  if (!signatureHeader || !secret) {
    return { valid: false, error: 'Missing signature or secret' }
  }

  if (!idempotencyKey) {
    return { valid: false, error: 'Missing idempotency key' }
  }

  // Idempotency Check
  if (processedWebhooks.has(idempotencyKey)) {
    return { valid: false, error: 'Webhook already processed' }
  }

  // Parse signature header: t=<timestamp>,v1=<hmac>
  const parts = signatureHeader.split(',')
  let timestamp = ''
  let signature = ''

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = value
    if (key === 'v1') signature = value
  }

  if (!timestamp || !signature) {
    return { valid: false, error: 'Invalid signature format' }
  }

  // Replay Protection (5 minutes)
  const webhookAge = Date.now() - parseInt(timestamp, 10)
  if (webhookAge > 5 * 60 * 1000 || webhookAge < -10000) {
    return { valid: false, error: 'Webhook signature expired (Replay protection)' }
  }

  // Verify Signature
  const payload = `${timestamp}.${rawBody}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  try {
    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    if (isValid) {
      // Mark as processed (naive garbage collection for memory safety)
      processedWebhooks.add(idempotencyKey)
      if (processedWebhooks.size > 1000) processedWebhooks.clear()
      return { valid: true }
    }
    return { valid: false, error: 'Invalid signature' }
  } catch (e) {
    return { valid: false, error: 'Signature comparison failed' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    
    const verification = await verifyWebhook(request, rawBody)
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error || 'Unauthorized' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
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

