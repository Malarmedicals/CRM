import { WhatsAppWebhookMessage, WhatsAppWebhookStatus } from './types';

export interface InboundMessageEvent {
  message: WhatsAppWebhookMessage;
  contact: { name: string; wa_id: string } | undefined;
  metadata: { phone_number_id: string; display_phone_number: string };
}

export interface MessageStatusEvent {
  status: WhatsAppWebhookStatus;
  metadata: { phone_number_id: string; display_phone_number: string };
}
