-- Migration script for Enterprise RBAC system

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- 2. Seed default enterprise roles
INSERT INTO public.roles (name, description, is_system, permissions) VALUES
('Super Administrator', 'Full unrestricted access to all modules and system settings.', true,
 '["dashboard.view", "users.view", "users.create", "users.edit", "users.delete", "users.assign_roles", "roles.view", "roles.create", "roles.edit", "roles.delete", "products.view", "products.create", "products.edit", "products.delete", "inventory.view", "inventory.manage", "inventory.adjust_stock", "inventory.view_history", "orders.view", "orders.edit", "orders.cancel", "orders.refund", "customers.view", "customers.edit", "customers.delete", "coupons.view", "coupons.create", "coupons.edit", "coupons.delete", "banners.view", "banners.create", "banners.edit", "banners.delete", "categories.view", "categories.create", "categories.edit", "categories.delete", "brands.view", "brands.create", "brands.edit", "brands.delete", "reports.view", "reports.export", "settings.view", "settings.update"]'::jsonb),

('Administrator', 'High-level access to everything except core system settings and role modifications.', false,
 '["dashboard.view", "users.view", "users.create", "users.edit", "users.assign_roles", "roles.view", "products.view", "products.create", "products.edit", "products.delete", "inventory.view", "inventory.manage", "inventory.adjust_stock", "inventory.view_history", "orders.view", "orders.edit", "orders.cancel", "orders.refund", "customers.view", "customers.edit", "customers.delete", "coupons.view", "coupons.create", "coupons.edit", "coupons.delete", "banners.view", "banners.create", "banners.edit", "banners.delete", "categories.view", "categories.create", "categories.edit", "categories.delete", "brands.view", "brands.create", "brands.edit", "brands.delete", "reports.view", "reports.export"]'::jsonb),

('Inventory Manager', 'Responsible for maintaining stock levels, adjustments, and products.', false,
 '["dashboard.view", "products.view", "products.create", "products.edit", "inventory.view", "inventory.manage", "inventory.adjust_stock", "inventory.view_history", "reports.view"]'::jsonb),

('Order Manager', 'Responsible for handling customer orders, shipments, refunds, and cancellations.', false,
 '["dashboard.view", "orders.view", "orders.edit", "orders.cancel", "orders.refund", "customers.view"]'::jsonb),

('Pharmacy Manager', 'Responsible for medicines, prescriptions, and healthcare compliance.', false,
 '["dashboard.view", "products.view", "products.create", "products.edit", "orders.view", "customers.view"]'::jsonb),

('Marketing Manager', 'Responsible for campaigns, homepage content, banners, and promotions.', false,
 '["dashboard.view", "coupons.view", "coupons.create", "coupons.edit", "coupons.delete", "banners.view", "banners.create", "banners.edit", "banners.delete", "categories.view", "categories.create", "categories.edit", "brands.view", "brands.create", "brands.edit"]'::jsonb),

('Customer Support', 'Assists customers, manages tickets, checks order and refund statuses.', false,
 '["dashboard.view", "orders.view", "customers.view", "customers.edit"]'::jsonb),

('Finance', 'Handles payments, transactions, and revenue reporting.', false,
 '["dashboard.view", "orders.view", "reports.view", "reports.export"]'::jsonb),

('Content Manager', 'Manages CMS pages, blog, categories, and brands.', false,
 '["dashboard.view", "categories.view", "categories.create", "categories.edit", "brands.view", "brands.create", "brands.edit"]'::jsonb),

('customer', 'Default customer role with frontend store access only.', true,
 '[]'::jsonb),

('admin', 'Legacy Admin mapping (mapped to Administrator)', true,
 '["dashboard.view", "users.view", "users.create", "users.edit", "users.assign_roles", "roles.view", "products.view", "products.create", "products.edit", "products.delete", "inventory.view", "inventory.manage", "inventory.adjust_stock", "inventory.view_history", "orders.view", "orders.edit", "orders.cancel", "orders.refund", "customers.view", "customers.edit", "customers.delete", "coupons.view", "coupons.create", "coupons.edit", "coupons.delete", "banners.view", "banners.create", "banners.edit", "banners.delete", "categories.view", "categories.create", "categories.edit", "categories.delete", "brands.view", "brands.create", "brands.edit", "brands.delete", "reports.view", "reports.export"]'::jsonb),

('manager', 'Legacy Manager mapping (mapped to Inventory Manager)', true,
 '["dashboard.view", "products.view", "products.create", "products.edit", "inventory.view", "inventory.manage", "inventory.adjust_stock", "inventory.view_history", "reports.view"]'::jsonb)

ON CONFLICT (name) DO UPDATE SET 
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;
