-- Malar Medicals CRM - WhatsApp Webhook Idempotency & Security Migration

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the base table if it does not exist at all
CREATE TABLE IF NOT EXISTS public.whatsapp_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_key TEXT NOT NULL UNIQUE
);

-- 2. Safely add columns (handles both new tables and existing partial schemas)
-- IMPORTANT DATA SAFETY NOTE:
-- If existing rows are present from a previous implementation, they will receive
-- status = 'processing' and locked_at = now(). This means they will appear as
-- "stale" processing events. If Meta retries them, they will be reclaimed and processed.
-- If they are never retried, they will safely remain in 'processing' indefinitely.
ALTER TABLE public.whatsapp_webhook_events 
    ADD COLUMN IF NOT EXISTS event_key TEXT,
    ADD COLUMN IF NOT EXISTS event_type TEXT,
    ADD COLUMN IF NOT EXISTS payload JSONB,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processing',
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_error TEXT,
    ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now());

-- 3. Ensure PRIMARY KEY exists safely
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.whatsapp_webhook_events'::regclass AND contype = 'p'
    ) THEN
        RAISE EXCEPTION 'Table whatsapp_webhook_events is missing a PRIMARY KEY and cannot be safely migrated automatically. Please add a PRIMARY KEY manually.';
    END IF;
END $$;

-- 4. Ensure event_key is NOT NULL safely
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_webhook_events' 
          AND column_name = 'event_key' 
          AND is_nullable = 'YES'
    ) THEN
        IF EXISTS (SELECT 1 FROM public.whatsapp_webhook_events WHERE event_key IS NULL) THEN
            RAISE EXCEPTION 'Cannot enforce NOT NULL on event_key: NULL values exist in the table. Manual cleanup required.';
        ELSE
            ALTER TABLE public.whatsapp_webhook_events ALTER COLUMN event_key SET NOT NULL;
        END IF;
    END IF;
END $$;

-- 5. Ensure UNIQUE constraint strictly on event_key safely
DO $$ 
BEGIN
    -- Check if a unique constraint or unique index specifically covering ONLY event_key exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'public.whatsapp_webhook_events'::regclass
          AND i.indisunique = true
          AND a.attname = 'event_key'
          AND i.indnkeyatts = 1 -- Only covers one column
    ) THEN
        -- Check for duplicate data before attempting to add constraint
        IF EXISTS (
            SELECT event_key 
            FROM public.whatsapp_webhook_events 
            GROUP BY event_key 
            HAVING COUNT(*) > 1
        ) THEN
            RAISE EXCEPTION 'Cannot add UNIQUE constraint on event_key: duplicate values exist in the table. Manual deduplication required.';
        ELSE
            ALTER TABLE public.whatsapp_webhook_events ADD CONSTRAINT whatsapp_webhook_events_event_key_key UNIQUE (event_key);
        END IF;
    END IF;
END $$;

-- 6. Secure the table with Row Level Security
ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke access from anon and authenticated client roles.
REVOKE ALL ON public.whatsapp_webhook_events FROM anon;
REVOKE ALL ON public.whatsapp_webhook_events FROM authenticated;
