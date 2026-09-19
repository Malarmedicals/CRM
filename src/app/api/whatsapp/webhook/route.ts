import { NextResponse } from 'next/server';
import { metaClient } from '@/features/whatsapp/infrastructure/meta-client';
import { webhookService } from '@/features/whatsapp/application/webhook-service';

/**
 * GET handler for WhatsApp webhook verification
 * Used by Meta to verify the endpoint configuration
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (!VERIFY_TOKEN) {
      console.error('[WhatsApp Webhook] META_WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set');
      return new NextResponse('Configuration error', { status: 500 });
    }

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WhatsApp Webhook] Verification successful');
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.warn('[WhatsApp Webhook] Verification failed. Token mismatch.');
      return new NextResponse('Forbidden', { status: 403 });
    }
  } catch (error) {
    console.error('[WhatsApp Webhook] Verification error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST handler for incoming WhatsApp webhook events
 */
export async function POST(request: Request) {
  try {
    // 1. Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const appSecret = process.env.META_WHATSAPP_APP_SECRET;

    // 2. Verify signature
    if (!appSecret) {
      console.error('[WhatsApp Webhook] META_WHATSAPP_APP_SECRET is not set');
      return new NextResponse('Configuration error', { status: 500 });
    }

    const isValid = metaClient.verifyWebhookSignature(rawBody, signature, appSecret);

    if (!isValid) {
      console.warn('[WhatsApp Webhook] Invalid signature detected');
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 3. Parse JSON safely
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error('[WhatsApp Webhook] Malformed JSON payload');
      return new NextResponse('Bad Request', { status: 400 });
    }

    // 4. Delegate to webhook service (don't await to avoid blocking Meta response)
    // Note: In Next.js App router, we usually want to await so the serverless function 
    // doesn't die. For very heavy processing, we'd queue it. Since our parsing is fast, 
    // we await it.
    await webhookService.processPayload(payload);

    // 5. Always return 200 OK fast so Meta doesn't retry
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Processing error:', error);
    // Even on error, we should often return 200 to prevent retries if it's our fault,
    // but 500 is standard for internal errors. We will return 200 to avoid retry spam
    // if the payload is somehow consistently crashing us, but let's stick to 500 for true 
    // unexpected errors.
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
