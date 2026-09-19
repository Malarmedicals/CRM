import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/whatsapp/webhook/route';
import { metaClient } from '@/features/whatsapp/infrastructure/meta-client';
import { webhookService } from '@/features/whatsapp/application/webhook-service';

// Mock dependencies
vi.mock('@/features/whatsapp/infrastructure/meta-client');

// Create chainable mock for Supabase
const createMockSupabase = () => {
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockUpdate = vi.fn();
  const mockLt = vi.fn();

  const mockFrom = vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
  }));

  // Setup the chain returns
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ eq: mockEq, select: mockSelect, single: mockSingle, lt: mockLt, maybeSingle: mockMaybeSingle });
  mockLt.mockReturnValue({ select: mockSelect, maybeSingle: mockMaybeSingle });

  return {
    from: mockFrom,
    _mocks: { mockInsert, mockSelect, mockEq, mockSingle, mockUpdate, mockLt, mockMaybeSingle }
  };
};

describe('WhatsApp Webhook API', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test-verify-token';
    process.env.META_WHATSAPP_APP_SECRET = 'test-app-secret';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  describe('GET (Verification)', () => {
    it('returns 200 and challenge with correct token', async () => {
      const request = new Request('http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=12345');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('12345');
    });

    it('returns 403 with incorrect token', async () => {
      const request = new Request('http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=12345');
      const response = await GET(request);
      
      expect(response.status).toBe(403);
    });
  });

  describe('POST (Event Receiving)', () => {
    const validPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '123', phone_number_id: '456' },
            messages: [{ from: '12345', id: 'msg_1', timestamp: '123', type: 'text', text: { body: 'Hello' } }]
          }
        }]
      }]
    };
    const validPayloadString = JSON.stringify(validPayload);

    it('returns 403 with invalid signature', async () => {
      vi.mocked(metaClient.verifyWebhookSignature).mockReturnValue(false);
      const request = new Request('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'x-hub-signature-256': 'sha256=invalid' },
        body: validPayloadString
      });
      const response = await POST(request);
      expect(response.status).toBe(403);
    });
  });

  describe('Idempotency Lifecycle (webhookService)', () => {
    beforeEach(() => {
      mockSupabase = createMockSupabase();
    });

    const runIdempotency = async (handler: () => Promise<void> = async () => {}) => {
      return webhookService.processEventIdempotently(
        mockSupabase,
        'message-1',
        'message',
        { id: '1' },
        handler
      );
    };

    it('First event: INSERT succeeds, handler runs, event becomes processed', async () => {
      mockSupabase._mocks.mockInsert.mockResolvedValue({ error: null });
      mockSupabase._mocks.mockUpdate.mockResolvedValue({ error: null });
      
      const handler = vi.fn().mockResolvedValue(undefined);
      await runIdempotency(handler);
      
      expect(mockSupabase._mocks.mockInsert).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
      expect(mockSupabase._mocks.mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'processed' }));
    });

    it('Exact duplicate after successful processing: handler does not run again', async () => {
      mockSupabase._mocks.mockInsert.mockResolvedValue({ error: { code: '23505' } });
      mockSupabase._mocks.mockSingle.mockResolvedValue({ 
        data: { id: '1', status: 'processed', locked_at: new Date().toISOString(), attempts: 1 }, 
        error: null 
      });
      
      const handler = vi.fn().mockResolvedValue(undefined);
      await runIdempotency(handler);
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('Event processing failure: event becomes failed and lock is released', async () => {
      mockSupabase._mocks.mockInsert.mockResolvedValue({ error: null });
      
      const handler = vi.fn().mockRejectedValue(new Error('Handler failed'));
      
      await expect(runIdempotency(handler)).rejects.toThrow('Handler failed');
      
      expect(mockSupabase._mocks.mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ 
        status: 'failed',
        last_error: 'Handler failed',
        locked_at: null
      }));
    });

    it('Concurrent active processing: skips execution', async () => {
      mockSupabase._mocks.mockInsert.mockResolvedValue({ error: { code: '23505' } });
      
      // Fresh lock (10 seconds ago)
      const freshLockTime = new Date(Date.now() - 10 * 1000).toISOString();
      mockSupabase._mocks.mockSingle.mockResolvedValueOnce({ 
        data: { id: '1', status: 'processing', locked_at: freshLockTime, attempts: 1 }, 
        error: null 
      });
      
      const handler = vi.fn().mockResolvedValue(undefined);
      await runIdempotency(handler);
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('Two simultaneous requests attempt to reclaim the same stale event (only one wins)', async () => {
      mockSupabase._mocks.mockInsert.mockResolvedValue({ error: { code: '23505' } });
      
      // Stale lock (10 minutes ago)
      const staleLockTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      mockSupabase._mocks.mockSingle.mockResolvedValue({ 
        data: { id: '1', status: 'processing', locked_at: staleLockTime, attempts: 1 }, 
        error: null 
      });

      // Mock `maybeSingle` for the atomic UPDATE:
      // Request A gets a row (won the race)
      // Request B gets null (lost the race)
      mockSupabase._mocks.mockMaybeSingle
        .mockResolvedValueOnce({ data: { id: '1' }, error: null }) // Request A
        .mockResolvedValueOnce({ data: null, error: null });       // Request B
      
      const handlerA = vi.fn().mockResolvedValue(undefined);
      const handlerB = vi.fn().mockResolvedValue(undefined);
      
      // Run concurrently
      await Promise.all([
        runIdempotency(handlerA),
        runIdempotency(handlerB)
      ]);
      
      // Exactly one executes
      expect(handlerA).toHaveBeenCalled();
      expect(handlerB).not.toHaveBeenCalled();
      
      // Ensure the atomic lt clause was used
      expect(mockSupabase._mocks.mockLt).toHaveBeenCalledWith('locked_at', expect.any(String));
    });

    it('Two simultaneous retries of the same failed event (only one wins)', async () => {
      mockSupabase._mocks.mockInsert.mockResolvedValue({ error: { code: '23505' } });
      
      mockSupabase._mocks.mockSingle.mockResolvedValue({ 
        data: { id: '1', status: 'failed', locked_at: null, attempts: 1 }, 
        error: null 
      });

      // Mock `maybeSingle` for the atomic UPDATE:
      // Request A gets a row (won the race)
      // Request B gets null (lost the race)
      mockSupabase._mocks.mockMaybeSingle
        .mockResolvedValueOnce({ data: { id: '1' }, error: null }) // Request A
        .mockResolvedValueOnce({ data: null, error: null });       // Request B
      
      const handlerA = vi.fn().mockResolvedValue(undefined);
      const handlerB = vi.fn().mockResolvedValue(undefined);
      
      await Promise.all([
        runIdempotency(handlerA),
        runIdempotency(handlerB)
      ]);
      
      expect(handlerA).toHaveBeenCalled();
      expect(handlerB).not.toHaveBeenCalled();
    });
  });
});
