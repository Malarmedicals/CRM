export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: Array<{
      profile: {
        name: string;
      };
      wa_id: string;
    }>;
    messages?: WhatsAppWebhookMessage[];
    statuses?: WhatsAppWebhookStatus[];
  };
  field: string;
}

export interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  [key: string]: any; // Allow other message types to be parsed defensively
}

export interface WhatsAppWebhookStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    origin: {
      type: string;
    };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: Array<{
    code: number;
    title: string;
    message: string;
    error_data: {
      details: string;
    };
  }>;
}
