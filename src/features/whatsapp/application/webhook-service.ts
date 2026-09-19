import { WhatsAppWebhookPayload } from '../domain/types';
import { InboundMessageEvent, MessageStatusEvent } from '../domain/events';
import { createClient } from '@supabase/supabase-js';

// Get a server-only Supabase client for idempotency tracking
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase admin credentials are not properly configured.');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export const webhookService = {
  /**
   * Process incoming WhatsApp webhook payload
   */
  async processPayload(payload: WhatsAppWebhookPayload): Promise<void> {
    if (payload.object !== 'whatsapp_business_account') {
      return;
    }

    if (!payload.entry || !Array.isArray(payload.entry)) {
      return;
    }

    const supabase = getSupabaseAdmin();

    for (const entry of payload.entry) {
      if (!entry.changes || !Array.isArray(entry.changes)) {
        continue;
      }

      for (const change of entry.changes) {
        if (change.field !== 'messages' || !change.value) {
          continue;
        }

        const value = change.value;
        const metadata = value.metadata;
        const contacts = value.contacts;

        // Process incoming messages
        if (value.messages && Array.isArray(value.messages)) {
          for (const message of value.messages) {
            const eventKey = `message-${message.id}`;
            const contactRaw = contacts?.find((c: any) => c.wa_id === message.from);
            const contact = contactRaw ? { name: contactRaw.profile?.name || '', wa_id: contactRaw.wa_id } : undefined;
            const event: InboundMessageEvent = { message, contact, metadata };
            await this.processEventIdempotently(
              supabase, 
              eventKey, 
              'message', 
              message, 
              () => this.handleInboundMessage(event)
            );
          }
        }

        // Process status updates (sent, delivered, read, failed)
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const status of value.statuses) {
            const eventKey = `status-${status.id}-${status.status}`;
            const event: MessageStatusEvent = { status, metadata };
            
            await this.processEventIdempotently(
              supabase, 
              eventKey, 
              'status', 
              status, 
              () => this.handleMessageStatus(event)
            );
          }
        }
      }
    }
  },

  /**
   * Atomic Event Lifecycle
   */
  async processEventIdempotently(
    supabase: any, 
    eventKey: string, 
    eventType: string, 
    payload: any, 
    handler: () => Promise<void>
  ): Promise<void> {
    // Step 1: Atomic Claim Attempt
    const { error: insertError } = await supabase
      .from('whatsapp_webhook_events')
      .insert({
        event_key: eventKey,
        event_type: eventType,
        payload: payload,
        status: 'processing',
        locked_at: new Date().toISOString(),
        attempts: 1
      });

    if (insertError) {
      // Postgres unique constraint violation indicates the event already exists
      if (insertError.code !== '23505') {
        console.error(`[WhatsApp Webhook] Error inserting event ${eventKey}:`, insertError);
        throw insertError;
      }
      
      // Step 2: Collision handling
      const { data: existingEvent, error: fetchError } = await supabase
        .from('whatsapp_webhook_events')
        .select('id, status, locked_at, attempts')
        .eq('event_key', eventKey)
        .single();
        
      if (fetchError || !existingEvent) {
         console.error(`[WhatsApp Webhook] Error fetching existing event ${eventKey}:`, fetchError);
         return; // Assume processed to prevent double processing in ambiguous state
      }

      if (existingEvent.status === 'processed') {
         console.log(`[WhatsApp Webhook] Skipping already processed event: ${eventKey}`);
         return;
      }

      if (existingEvent.status === 'processing') {
         // Attempt ATOMIC stale lease reclaim
         const staleThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
         
         const { data: reclaimed, error: updateError } = await supabase
           .from('whatsapp_webhook_events')
           .update({
             status: 'processing',
             locked_at: new Date().toISOString(),
             attempts: existingEvent.attempts + 1
           })
           .eq('id', existingEvent.id)
           .eq('status', 'processing')
           .lt('locked_at', staleThreshold) // Critical atomic concurrency check
           .select()
           .maybeSingle(); // Returns null if no rows updated (e.g. lost race)

         if (updateError) {
           console.error(`[WhatsApp Webhook] Error reclaiming stale event ${eventKey}:`, updateError);
           return;
         }

         if (!reclaimed) {
           console.log(`[WhatsApp Webhook] Skipping concurrently processing event or lost reclaim race: ${eventKey}`);
           return;
         }
         
         console.log(`[WhatsApp Webhook] Successfully reclaimed stale event lock: ${eventKey}`);
      } else if (existingEvent.status === 'failed') {
         // Attempt ATOMIC failed lease reclaim
         const { data: reclaimed, error: updateError } = await supabase
           .from('whatsapp_webhook_events')
           .update({
             status: 'processing',
             locked_at: new Date().toISOString(),
             attempts: existingEvent.attempts + 1,
             last_error: null
           })
           .eq('id', existingEvent.id)
           .eq('status', 'failed') // Critical atomic concurrency check
           .select()
           .maybeSingle();

         if (updateError) {
           console.error(`[WhatsApp Webhook] Error reclaiming failed event ${eventKey}:`, updateError);
           return;
         }

         if (!reclaimed) {
           console.log(`[WhatsApp Webhook] Lost reclaim race for failed event: ${eventKey}`);
           return;
         }
         
         console.log(`[WhatsApp Webhook] Successfully reclaimed failed event lock: ${eventKey}`);
      }
    }

    // Step 3: Execute handler with the leased ownership
    try {
      await handler();
      
      // Success: mark processed
      await supabase
        .from('whatsapp_webhook_events')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          failed_at: null,
          last_error: null,
          locked_at: null
        })
        .eq('event_key', eventKey);
        
    } catch (e: any) {
      // Failure: mark failed, record error, release lock
      const errorMessage = e?.message || String(e);
      await supabase
        .from('whatsapp_webhook_events')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          last_error: errorMessage.substring(0, 500),
          locked_at: null // Release lock explicitly for retry
        })
        .eq('event_key', eventKey);
        
      // Throw error so the API route can return 500 and trigger Meta retry
      throw e;
    }
  },

  /**
   * Handle an inbound message from a customer
   */
  async handleInboundMessage(event: InboundMessageEvent): Promise<void> {
    console.log(`[WhatsApp Webhook] Inbound message received from ${event.message.from}`);
    // FUTURE: Persist to Supabase inbox table
  },

  /**
   * Handle an outbound message status update
   */
  async handleMessageStatus(event: MessageStatusEvent): Promise<void> {
    console.log(`[WhatsApp Webhook] Message status updated: ${event.status.id} -> ${event.status.status}`);
    // FUTURE: Update status in Supabase `whatsapp_queue`
  }
};
