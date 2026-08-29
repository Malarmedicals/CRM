-- Run this in the CRM's Supabase SQL Editor (requires service_role / owner).
-- Adds the columns the shipment.updated webhook handler
-- (src/app/api/integration/webhooks/route.ts) writes onto `orders` when the
-- e-commerce app syncs a BlueDart shipment status change.
-- Column names are quoted camelCase to match this table's existing
-- convention (see "userId", "isActive" etc. in add-missing-columns.sql).

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "awbNo" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "courierStatus" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "estimatedDelivery" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "lastScanLocation" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "lastScanTimestamp" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "codAmount" NUMERIC(12,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_awb_no ON public.orders ("awbNo") WHERE "awbNo" IS NOT NULL;
