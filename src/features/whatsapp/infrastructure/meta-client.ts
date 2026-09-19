import crypto from 'crypto';

export const metaClient = {
  /**
   * Verifies the X-Hub-Signature-256 header from Meta webhooks
   * @param payload Raw request body as a string or buffer
   * @param signature Header value (e.g., 'sha256=...')
   * @param appSecret Meta App Secret
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string | null, appSecret: string): boolean {
    if (!signature || !signature.startsWith('sha256=')) {
      return false;
    }

    if (!appSecret) {
      console.error('[WhatsApp Webhook] META_WHATSAPP_APP_SECRET is not configured.');
      return false;
    }

    const signatureHash = signature.split('sha256=')[1];
    
    const expectedHash = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    try {
      // Use constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(expectedHash),
        Buffer.from(signatureHash)
      );
    } catch (e) {
      return false;
    }
  }
};
