-- =============================================================================
-- KOPI SESUK ERP - COMPLETE DDL & FULL EXCEL DATA INJECTION (v2)
-- Source: Kopi Sesuk ERP (2).xlsx
-- Generated At: 2026-10-12 19:34:47
-- Target Database: Supabase / PostgreSQL 14+
-- Usage: Buka Supabase SQL Editor -> Paste Semua Konten -> Klik RUN
-- =============================================================================

BEGIN;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin', 'store_admin', 'kasir', 'finance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_segment AS ENUM ('BNPP', 'BAF', 'CFD', 'POS', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('DP', 'LUNAS', 'BELUM_BAYAR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('CASH', 'QRIS', 'TRANSFER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABLE DEFINITIONS (DDL matching schema.sql & ERPContext.jsx)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type account_type NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    base_unit VARCHAR(20) NOT NULL,
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    avg_daily_usage NUMERIC(12, 2) DEFAULT 0,
    max_daily_usage NUMERIC(12, 2) DEFAULT 0,
    avg_lead_time_days NUMERIC(5, 2) DEFAULT 1,
    max_lead_time_days NUMERIC(5, 2) DEFAULT 2,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) DEFAULT 'Kopi',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_label VARCHAR(50) NOT NULL,
    size_ml INTEGER NOT NULL,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bom_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    qty_required NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(variant_id, raw_material_id)
);
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    segment order_segment NOT NULL DEFAULT 'POS',
    delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status order_status NOT NULL DEFAULT 'PENDING',
    payment_status payment_status NOT NULL DEFAULT 'LUNAS',
    payment_method payment_method NOT NULL DEFAULT 'CASH',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_hpp NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    sugar_level VARCHAR(30) DEFAULT 'Normal',
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    unit_hpp NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12, 2) NOT NULL,
    subtotal_hpp NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    transaction_type VARCHAR(20) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reference_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    reference_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS journal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(10) NOT NULL REFERENCES chart_of_accounts(code),
    debit NUMERIC(14, 4) NOT NULL DEFAULT 0,
    credit NUMERIC(14, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS opex_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_account_code VARCHAR(10) REFERENCES chart_of_accounts(code) DEFAULT '101',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_email VARCHAR(150) NOT NULL DEFAULT 'admin@kopisesuk.com',
    role VARCHAR(50) NOT NULL DEFAULT 'Admin ERP',
    action VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. SEED: CHART OF ACCOUNTS
-- =============================================================================
INSERT INTO chart_of_accounts (code, name, type, description) VALUES ('101', 'Kas', 'ASSET', 'Kas & Bank operasional') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description;
INSERT INTO chart_of_accounts (code, name, type, description) VALUES ('102', 'Persediaan', 'ASSET', 'Persediaan bahan baku & kemasan') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description;
INSERT INTO chart_of_accounts (code, name, type, description) VALUES ('103', 'Aset', 'ASSET', 'Aset peralatan & perlengkapan usaha') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description;
INSERT INTO chart_of_accounts (code, name, type, description) VALUES ('201', 'Hutang Dagang', 'LIABILITY', 'Kewajiban hutang dagang supplier') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description;
INSERT INTO chart_of_accounts (code, name, type, description) VALUES ('202', 'Hutang ke Owner', 'LIABILITY', 'Kewajiban hutang kepada owner (Arif / Faldi)') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description;
INSERT INTO chart_of_accounts (code, name, type, description) VALUES ('301', 'Modal', 'EQUITY', 'Modal disetor pemilik toko') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description;
INSERT INTO chart_of_accounts (code, name, type, description) VALUES ('401', 'Pendapatan', 'REVENUE', 'Pendapatan penjualan PO & CFD') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description;
INSERT INTO chart_of_accounts (code, name, type, description) VALUES ('501', 'BPP', 'EXPENSE', 'Biaya Pokok Penjualan (HPP produk)') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description;
INSERT INTO chart_of_accounts (code, name, type, description) VALUES ('601', 'Biaya Lain-lain', 'EXPENSE', 'Beban operasional & lain-lain') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description;

-- =============================================================================
-- 5. SEED: RAW MATERIALS (from DATABASE BAHAN & PERLENGKAPAN)
-- =============================================================================
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('775a5d7f-4b6d-d419-f8c6-d167d8bf00da', 'Susu UHT', 'ml', 9768.0, 20.0, 976.8, 1465.2, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('d8322b1f-cfa5-11cb-5f1e-21b16ffaa4f1', 'Krimer', 'gr', 1022.0, 72.0, 102.2, 153.3, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('f3babb65-e344-ee19-6ac8-f1e22cc9d065', 'BTS Drip', 'ml', 760.0, 118.42, 76.0, 114.0, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('059acbe6-6a2a-a574-396f-7195565b41d8', 'Caramee', 'ml', 1000.0, 90.0, 100.0, 150.0, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('3d908039-e8c4-3680-59e9-41b3588916f4', 'Nes Biru', 'rtg', 110.0, 1390.0, 11.0, 16.5, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('9f943fc8-d01a-ccff-ece7-c36fe31b3796', 'Nes Item', 'rtg', 10.0, 1200.0, 1, 1.5, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('c0d11771-8e1f-3f31-a7e7-0ae701f35158', 'Kp Api', 'gr', 90.0, 166.67, 9.0, 13.5, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('6fe3fdf7-87a5-aefd-8d64-bb2bdf078f64', 'Whip Cream', 'gr', 200.0, 125.0, 20.0, 30.0, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('12a2797b-9871-3599-b30e-6b976a556e13', 'Cup & Kemasan', 'pcs', 100.0, 961.01, 10.0, 15.0, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('e048a1f2-c08c-b183-aa9d-ced66c6040e5', 'Biaya Transportasi', 'ls', 1.0, 3000.0, 1, 1.5, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('474a9209-24e5-c239-f533-ed58f4f6697b', 'Cooler Bag', 'pcs', 1.0, 40000.0, 1, 1.5, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('48e0086e-1128-337d-2d77-c077c69ff11d', 'Gula Aren', 'ml', 1000.0, 38.0, 100.0, 150.0, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('58971233-be8b-8ed9-0630-5113ea150e12', 'Meja Lipat', 'pcs', 1.0, 248900.0, 1, 1.5, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('50163f41-90ee-76e6-bd03-edc9ef421ad9', 'ChocoDrink', 'rtg', 420.0, 1483.33, 42.0, 63.0, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('d6fd7703-3687-12ba-1e66-18dcc294e142', 'SKM', 'ml', 11.0, 83.33, 1.1, 1.65, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('ff959885-d57f-c9cf-da8a-b8605d9491ef', 'Label Merk', 'pcs', 33.0, 740.0, 3.3, 4.95, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('cfb31488-a2e1-416e-569e-e9aabf7ebb47', 'Kantong Plastik', 'pcs', 100.0, 180.0, 10.0, 15.0, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('0c718967-5d02-385f-202f-d9dd25aafce6', 'Es Batu', 'kg', 6.0, 714.29, 1, 1.5, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('f320f13b-d751-1fe3-3d6b-7fed2e184787', 'BTS CGK', 'ml', 547.9, 65.0, 54.79, 82.19, 1, 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_unit = EXCLUDED.base_unit, current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES ('5afb2a69-b4e5-1e48-b222-8d73bafd3bed', 'Botol 1l', 'pcs', 2.0, 2500.0, 1, 2, 1, 2) ON CONFLICT (id) DO UPDATE SET current_stock = EXCLUDED.current_stock, unit_price = EXCLUDED.unit_price;

-- =============================================================================
-- 6. SEED: PRODUCTS & PRODUCT VARIANTS
-- =============================================================================
INSERT INTO products (id, name, code, category) VALUES ('deb6dcce-fa65-9a4c-b42f-9f4ca9109d38', 'Buttersesuk', 'PROD-BTS', 'Kopi') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;
INSERT INTO product_variants (id, product_id, size_label, size_ml, selling_price) VALUES ('bf762630-4e62-3283-8b09-504e50339de3', 'deb6dcce-fa65-9a4c-b42f-9f4ca9109d38', '250 ml (Cup)', 250, 10000) ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;
INSERT INTO product_variants (id, product_id, size_label, size_ml, selling_price) VALUES ('8a62ef7b-f736-a3eb-bb96-ce04ddd9de80', 'deb6dcce-fa65-9a4c-b42f-9f4ca9109d38', '1 Liter (Botol)', 1000, 60000) ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;
INSERT INTO products (id, name, code, category) VALUES ('13147a3f-9fdb-a02b-a456-d2d15964ed67', 'Kopi Susu Aren', 'PROD-KSA', 'Kopi') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;
INSERT INTO product_variants (id, product_id, size_label, size_ml, selling_price) VALUES ('09e652e1-2410-28b6-3392-17ce2620b99c', '13147a3f-9fdb-a02b-a456-d2d15964ed67', '250 ml (Cup)', 250, 10000) ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;
INSERT INTO product_variants (id, product_id, size_label, size_ml, selling_price) VALUES ('9239ec2e-0e14-e8a4-d0cb-13214439327c', '13147a3f-9fdb-a02b-a456-d2d15964ed67', '1 Liter (Botol)', 1000, 60000) ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;
INSERT INTO products (id, name, code, category) VALUES ('34f98f7b-c326-c322-b375-76bb0cdc2a13', 'Americano', 'PROD-AMC', 'Kopi') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;
INSERT INTO product_variants (id, product_id, size_label, size_ml, selling_price) VALUES ('26acad3c-77f8-05fb-947e-fb98f141b29c', '34f98f7b-c326-c322-b375-76bb0cdc2a13', '250 ml (Cup)', 250, 7000) ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;
INSERT INTO product_variants (id, product_id, size_label, size_ml, selling_price) VALUES ('2993bea0-3d5f-4bc2-54f5-a2249c234657', '34f98f7b-c326-c322-b375-76bb0cdc2a13', '1 Liter (Botol)', 1000, 60000) ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;
INSERT INTO products (id, name, code, category) VALUES ('842e6493-6732-6bc7-973a-3f939710dbcd', 'Coklat Sesuk', 'PROD-CKS', 'Non-Kopi') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;
INSERT INTO product_variants (id, product_id, size_label, size_ml, selling_price) VALUES ('fa99607c-8c2d-3525-ca58-47a57f12d199', '842e6493-6732-6bc7-973a-3f939710dbcd', '250 ml (Cup)', 250, 10000) ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;
INSERT INTO product_variants (id, product_id, size_label, size_ml, selling_price) VALUES ('967b888d-92f7-d4af-de03-39abeb09aec0', '842e6493-6732-6bc7-973a-3f939710dbcd', '1 Liter (Botol)', 1000, 60000) ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;

-- =============================================================================
-- 7. SEED: BOM RECIPES (from BEP PER MENU)
-- =============================================================================
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('a583cb25-15b1-a8f8-5724-eee4aac8dd47', 'bf762630-4e62-3283-8b09-504e50339de3', '775a5d7f-4b6d-d419-f8c6-d167d8bf00da', 90.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('38dccaf1-b266-185c-9f5f-f4d2eb9b9cf8', 'bf762630-4e62-3283-8b09-504e50339de3', 'd8322b1f-cfa5-11cb-5f1e-21b16ffaa4f1', 10.7143) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('04ab7338-86c6-8f1b-0a19-7684373d133d', 'bf762630-4e62-3283-8b09-504e50339de3', 'f320f13b-d751-1fe3-3d6b-7fed2e184787', 7.1429) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('75bd8a2a-c1e4-f678-6225-11cf6d28f3ba', 'bf762630-4e62-3283-8b09-504e50339de3', '3d908039-e8c4-3680-59e9-41b3588916f4', 0.5) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('aaa7a31a-f273-34d8-ac42-514a6af31df9', 'bf762630-4e62-3283-8b09-504e50339de3', 'c0d11771-8e1f-3f31-a7e7-0ae701f35158', 7.1429) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('57c6f0f0-91c0-bdd7-8416-3895203376d4', 'bf762630-4e62-3283-8b09-504e50339de3', '6fe3fdf7-87a5-aefd-8d64-bb2bdf078f64', 1.4286) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('8f2e8d32-145b-ad31-31c6-a8624f081b9f', 'bf762630-4e62-3283-8b09-504e50339de3', '12a2797b-9871-3599-b30e-6b976a556e13', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('6f2093b3-015e-6c87-49ec-d97711c64dda', 'bf762630-4e62-3283-8b09-504e50339de3', 'ff959885-d57f-c9cf-da8a-b8605d9491ef', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('f0d4cf3a-d49f-a4dd-cde5-2b4fab27bea3', '8a62ef7b-f736-a3eb-bb96-ce04ddd9de80', '775a5d7f-4b6d-d419-f8c6-d167d8bf00da', 360.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('647dc9fc-d246-1f52-37c0-e52b500ed629', '8a62ef7b-f736-a3eb-bb96-ce04ddd9de80', 'd8322b1f-cfa5-11cb-5f1e-21b16ffaa4f1', 42.8571) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('92c68a5a-f0da-0046-4a78-6ecc1493d002', '8a62ef7b-f736-a3eb-bb96-ce04ddd9de80', 'f320f13b-d751-1fe3-3d6b-7fed2e184787', 28.5714) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('8f61c1b8-8106-e597-6e9f-57ca1a66ba94', '8a62ef7b-f736-a3eb-bb96-ce04ddd9de80', '3d908039-e8c4-3680-59e9-41b3588916f4', 2.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('f54c14a1-b76a-1d56-88b6-8eb1809cd238', '8a62ef7b-f736-a3eb-bb96-ce04ddd9de80', 'c0d11771-8e1f-3f31-a7e7-0ae701f35158', 28.5714) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('df411831-97ec-8a4e-2b02-387872db511b', '8a62ef7b-f736-a3eb-bb96-ce04ddd9de80', '6fe3fdf7-87a5-aefd-8d64-bb2bdf078f64', 5.7143) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('adf07718-1cc8-5fd4-9be3-11809a36c240', '8a62ef7b-f736-a3eb-bb96-ce04ddd9de80', '5afb2a69-b4e5-1e48-b222-8d73bafd3bed', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('7eb99755-3af0-944c-b04b-ffe1479519f7', '8a62ef7b-f736-a3eb-bb96-ce04ddd9de80', 'ff959885-d57f-c9cf-da8a-b8605d9491ef', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('1e16cf8b-40da-08ea-e75d-7a7d65d8ac65', '09e652e1-2410-28b6-3392-17ce2620b99c', '775a5d7f-4b6d-d419-f8c6-d167d8bf00da', 90.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('d04bc0f0-ba6f-0276-153f-5a678e215529', '09e652e1-2410-28b6-3392-17ce2620b99c', 'd8322b1f-cfa5-11cb-5f1e-21b16ffaa4f1', 10.7143) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('8d2a3139-4338-1e60-308b-f1acc98457a6', '09e652e1-2410-28b6-3392-17ce2620b99c', '48e0086e-1128-337d-2d77-c077c69ff11d', 7.1429) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('b50949b3-dab5-b5cd-b124-eac99173e2a7', '09e652e1-2410-28b6-3392-17ce2620b99c', '3d908039-e8c4-3680-59e9-41b3588916f4', 0.5) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('314a6918-e95c-21fc-a24e-dcf7d8043c63', '09e652e1-2410-28b6-3392-17ce2620b99c', 'c0d11771-8e1f-3f31-a7e7-0ae701f35158', 7.1429) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('8d8b6d5d-894b-4bca-a41c-83d6060a7c7c', '09e652e1-2410-28b6-3392-17ce2620b99c', '12a2797b-9871-3599-b30e-6b976a556e13', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('6d73a2da-7d7e-4a32-6660-8a42690d9706', '09e652e1-2410-28b6-3392-17ce2620b99c', 'ff959885-d57f-c9cf-da8a-b8605d9491ef', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('4460c841-3ab4-ff4d-e1dc-9bb43b3efa11', '9239ec2e-0e14-e8a4-d0cb-13214439327c', '775a5d7f-4b6d-d419-f8c6-d167d8bf00da', 360.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('2923cad9-0302-2053-5604-c12c29b0a294', '9239ec2e-0e14-e8a4-d0cb-13214439327c', 'd8322b1f-cfa5-11cb-5f1e-21b16ffaa4f1', 42.8571) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('2729f3b9-33da-3f92-9ccf-f8fec19c2910', '9239ec2e-0e14-e8a4-d0cb-13214439327c', '48e0086e-1128-337d-2d77-c077c69ff11d', 28.5714) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('60f9d1e4-ca62-9249-d6cd-663ebd2bcbfd', '9239ec2e-0e14-e8a4-d0cb-13214439327c', '3d908039-e8c4-3680-59e9-41b3588916f4', 2.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('7a626d73-ebe3-85f5-71f1-0b7c8d421ea6', '9239ec2e-0e14-e8a4-d0cb-13214439327c', 'c0d11771-8e1f-3f31-a7e7-0ae701f35158', 28.5714) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('3cd59caf-e7c2-d9db-4610-0d269bea5798', '9239ec2e-0e14-e8a4-d0cb-13214439327c', '5afb2a69-b4e5-1e48-b222-8d73bafd3bed', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('2c96c013-47c3-26c9-832e-dc0600bec465', '9239ec2e-0e14-e8a4-d0cb-13214439327c', 'ff959885-d57f-c9cf-da8a-b8605d9491ef', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('c6e5473e-08e4-0461-0d6c-5877eb02ab31', '26acad3c-77f8-05fb-947e-fb98f141b29c', '3d908039-e8c4-3680-59e9-41b3588916f4', 0.5) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('76d17b24-8700-052a-6c4f-e0a5132403da', '26acad3c-77f8-05fb-947e-fb98f141b29c', 'c0d11771-8e1f-3f31-a7e7-0ae701f35158', 7.1429) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('b760a1ee-6ec0-8c81-80dc-a5fe11f0a267', '26acad3c-77f8-05fb-947e-fb98f141b29c', '12a2797b-9871-3599-b30e-6b976a556e13', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('daeb9ab3-1cf6-3088-dc0f-6c3b815e6a94', '26acad3c-77f8-05fb-947e-fb98f141b29c', 'ff959885-d57f-c9cf-da8a-b8605d9491ef', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('d0e3e79f-2d4c-8b74-5cdd-cdb2c08331a3', '2993bea0-3d5f-4bc2-54f5-a2249c234657', '3d908039-e8c4-3680-59e9-41b3588916f4', 2.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('2f2f400c-8361-8001-4c41-2530f2a0d8ae', '2993bea0-3d5f-4bc2-54f5-a2249c234657', 'c0d11771-8e1f-3f31-a7e7-0ae701f35158', 28.5714) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('d9920e4a-bad7-d091-48d6-384f91f77616', '2993bea0-3d5f-4bc2-54f5-a2249c234657', '5afb2a69-b4e5-1e48-b222-8d73bafd3bed', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('85457d91-2a33-905e-2430-0562b54f06d6', '2993bea0-3d5f-4bc2-54f5-a2249c234657', 'ff959885-d57f-c9cf-da8a-b8605d9491ef', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('a57bbddd-4eae-a662-a292-37813d151818', 'fa99607c-8c2d-3525-ca58-47a57f12d199', '50163f41-90ee-76e6-bd03-edc9ef421ad9', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('ddf6a47b-095e-2010-9265-bde1813d56cd', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'd8322b1f-cfa5-11cb-5f1e-21b16ffaa4f1', 12.5) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('1cad4580-5553-a483-27ee-c296c082e36e', 'fa99607c-8c2d-3525-ca58-47a57f12d199', '775a5d7f-4b6d-d419-f8c6-d167d8bf00da', 45.8333) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('1ff42c3a-4748-9d29-5c4c-6d13f167f7bd', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'd6fd7703-3687-12ba-1e66-18dcc294e142', 8.3333) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('6de311f9-bd23-b480-fe12-778ef59f5b90', 'fa99607c-8c2d-3525-ca58-47a57f12d199', '12a2797b-9871-3599-b30e-6b976a556e13', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('ca3b1683-faad-e1fb-1c42-6c5070852321', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'ff959885-d57f-c9cf-da8a-b8605d9491ef', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('5a26a9ac-769f-ada3-9987-022c67d4f8b1', '967b888d-92f7-d4af-de03-39abeb09aec0', '50163f41-90ee-76e6-bd03-edc9ef421ad9', 4.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('df3ba131-aca9-0436-e4dd-5e6b39ba6302', '967b888d-92f7-d4af-de03-39abeb09aec0', 'd8322b1f-cfa5-11cb-5f1e-21b16ffaa4f1', 50.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('1663ca8e-daf8-46f9-53f4-b7bff32446af', '967b888d-92f7-d4af-de03-39abeb09aec0', '775a5d7f-4b6d-d419-f8c6-d167d8bf00da', 183.3333) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('4ccc8358-9cf7-db3d-a445-85eb5a2db0c1', '967b888d-92f7-d4af-de03-39abeb09aec0', 'd6fd7703-3687-12ba-1e66-18dcc294e142', 33.3333) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('87108e15-0b08-032b-caf3-6c64a99221ac', '967b888d-92f7-d4af-de03-39abeb09aec0', '5afb2a69-b4e5-1e48-b222-8d73bafd3bed', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;
INSERT INTO bom_recipes (id, variant_id, raw_material_id, qty_required) VALUES ('a6e56003-d0d2-f6b2-cf0c-fc4439eded36', '967b888d-92f7-d4af-de03-39abeb09aec0', 'ff959885-d57f-c9cf-da8a-b8605d9491ef', 1.0) ON CONFLICT (variant_id, raw_material_id) DO UPDATE SET qty_required = EXCLUDED.qty_required;

-- =============================================================================
-- 8. SEED: PURCHASE ORDERS (from PURCHASE ORDER sheet)
-- =============================================================================
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('8e68bf16-3dc1-675a-4df3-471ddc5a2cf0', 'PO-20260916-BAF', 'PT Bank BAF', 'BAF', '2026-09-16', 'COMPLETED', 'LUNAS', 'CASH', 120000.0, 75748.74, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('684b488d-502d-d498-b9d2-a2139f48089a', '8e68bf16-3dc1-675a-4df3-471ddc5a2cf0', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 6, 10000.0, 6929.34, 60000.0, 41576.04) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('f056a240-db14-7aae-bd5b-2dbfb41b4532', '8e68bf16-3dc1-675a-4df3-471ddc5a2cf0', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 6, 10000.0, 5695.45, 60000.0, 34172.7) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('ece15d2e-171a-5e82-9d5b-75528d934fbe', 'PO-20260916-BNPP', 'Badan Pengelola Keuangan (BNPP)', 'BNPP', '2026-09-16', 'COMPLETED', 'LUNAS', 'CASH', 57000.0, 37179.7, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('46751927-b11f-c79a-f4fb-140a28782784', 'ece15d2e-171a-5e82-9d5b-75528d934fbe', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 3, 10000.0, 7400.77, 30000.0, 22202.31) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('290cc9ff-0242-9bb8-e691-ad0de099399b', 'ece15d2e-171a-5e82-9d5b-75528d934fbe', '26acad3c-77f8-05fb-947e-fb98f141b29c', 'Normal', 1, 7000.0, 3586.49, 7000.0, 3586.49) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('4130a141-ff97-9aa1-42e4-6c69391ac4d8', 'ece15d2e-171a-5e82-9d5b-75528d934fbe', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 2, 10000.0, 5695.45, 20000.0, 11390.9) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('1226dd8c-22f7-34bb-24f0-9f965f9818c6', 'PO-20260916-OTHER', 'Pre-Order General', 'OTHER', '2026-09-16', 'COMPLETED', 'LUNAS', 'CASH', 150000.0, 100890.26, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('820ae26b-ca02-9bbd-a3f0-16250ee746aa', '1226dd8c-22f7-34bb-24f0-9f965f9818c6', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 4, 10000.0, 7400.77, 40000.0, 29603.08) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('50a6c029-3378-ef8d-55a4-ff1eaf04c689', '1226dd8c-22f7-34bb-24f0-9f965f9818c6', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 7, 10000.0, 6929.34, 70000.0, 48505.38) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('1fead67f-e6cc-44d1-bc70-f76c11c92b3f', '1226dd8c-22f7-34bb-24f0-9f965f9818c6', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 4, 10000.0, 5695.45, 40000.0, 22781.8) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('d4943093-5868-bb1a-7735-a42fcb94497f', 'PO-20260918-BNPP', 'Badan Pengelola Keuangan (BNPP)', 'BNPP', '2026-09-18', 'COMPLETED', 'LUNAS', 'CASH', 27000.0, 17916.6, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('a8d9f290-0f1a-b571-f958-15b223a16acf', 'd4943093-5868-bb1a-7735-a42fcb94497f', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 1, 10000.0, 7400.77, 10000.0, 7400.77) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('09287d55-0a5a-ca13-c759-53626e74e881', 'd4943093-5868-bb1a-7735-a42fcb94497f', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 1, 10000.0, 6929.34, 10000.0, 6929.34) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('b8b5f63f-c27f-5698-bfd7-8c55faf5ecc0', 'd4943093-5868-bb1a-7735-a42fcb94497f', '26acad3c-77f8-05fb-947e-fb98f141b29c', 'Normal', 1, 7000.0, 3586.49, 7000.0, 3586.49) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('29314e66-1d77-78f2-1d8f-e52f06610b17', 'PO-20260921-BNPP', 'Badan Pengelola Keuangan (BNPP)', 'BNPP', '2026-09-21', 'COMPLETED', 'LUNAS', 'CASH', 80000.0, 37390.9, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('c59504d5-d50b-f8f3-4c42-f9646f56b5ef', '29314e66-1d77-78f2-1d8f-e52f06610b17', '9239ec2e-0e14-e8a4-d0cb-13214439327c', 'Normal', 1, 60000.0, 26000.0, 60000.0, 26000.0) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('005ef108-6c9d-5f80-f24f-7563b9598eb9', '29314e66-1d77-78f2-1d8f-e52f06610b17', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 2, 10000.0, 5695.45, 20000.0, 11390.9) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('0ee9b8dc-c800-9e7f-787b-b0772ed56c69', 'PO-20260922-BNPP', 'Badan Pengelola Keuangan (BNPP)', 'BNPP', '2026-09-22', 'COMPLETED', 'LUNAS', 'CASH', 80000.0, 59206.16, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('22b5c68c-dc2b-cfdf-a6d2-5a0707f0dfac', '0ee9b8dc-c800-9e7f-787b-b0772ed56c69', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 8, 10000.0, 7400.77, 80000.0, 59206.16) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('ce430065-82b7-e314-5b4f-27d41337090e', 'PO-20260923-BNPP', 'Badan Pengelola Keuangan (BNPP)', 'BNPP', '2026-09-23', 'COMPLETED', 'LUNAS', 'CASH', 140000.0, 82849.01, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('9b9bd811-0c6d-8e8d-24b7-9399ff0febb8', 'ce430065-82b7-e314-5b4f-27d41337090e', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 5, 10000.0, 6929.34, 50000.0, 34646.7) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('d88bfc4f-c520-9066-5165-16cfc72567f0', 'ce430065-82b7-e314-5b4f-27d41337090e', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 3, 10000.0, 7400.77, 30000.0, 22202.31) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('b274b936-bc02-19c0-a341-375339abc97f', 'ce430065-82b7-e314-5b4f-27d41337090e', '9239ec2e-0e14-e8a4-d0cb-13214439327c', 'Normal', 1, 60000.0, 26000.0, 60000.0, 26000.0) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('e1133801-104b-4a27-29c9-cdf0ced94663', 'PO-20260925-BAF', 'PT Bank BAF', 'BAF', '2026-09-25', 'COMPLETED', 'LUNAS', 'CASH', 70000.0, 33695.45, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('b6a156c6-b45f-7c55-29cd-bc83932bcd1b', 'e1133801-104b-4a27-29c9-cdf0ced94663', '8a62ef7b-f736-a3eb-bb96-ce04ddd9de80', 'Normal', 1, 60000.0, 28000.0, 60000.0, 28000.0) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('5bfca0ba-b6c8-6671-9dff-5a441dbc9e2f', 'e1133801-104b-4a27-29c9-cdf0ced94663', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 1, 10000.0, 5695.45, 10000.0, 5695.45) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('4c13133c-8dd7-e629-f3c7-5f129920e99c', 'PO-20260925-BNPP', 'Badan Pengelola Keuangan (BNPP)', 'BNPP', '2026-09-25', 'COMPLETED', 'LUNAS', 'CASH', 70000.0, 39868.15, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('c37ce4af-cdf5-ce04-200a-ae496a3a16d7', '4c13133c-8dd7-e629-f3c7-5f129920e99c', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 7, 10000.0, 5695.45, 70000.0, 39868.15) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('a8ba2a57-7927-7d0e-2294-a6130952bc2d', 'PO-20260928-BAF', 'PT Bank BAF', 'BAF', '2026-09-28', 'COMPLETED', 'LUNAS', 'CASH', 20000.0, 14330.11, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('ec1d6303-06b5-7a6f-4c48-4600a0dee38e', 'a8ba2a57-7927-7d0e-2294-a6130952bc2d', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 1, 10000.0, 6929.34, 10000.0, 6929.34) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('75279384-8a40-f4c1-120a-8ba212692935', 'a8ba2a57-7927-7d0e-2294-a6130952bc2d', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 1, 10000.0, 7400.77, 10000.0, 7400.77) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('f8ebd260-26e6-1f1e-5f41-23f4d052e960', 'PO-20260928-BNPP', 'Badan Pengelola Keuangan (BNPP)', 'BNPP', '2026-09-28', 'COMPLETED', 'LUNAS', 'CASH', 120000.0, 67285.01, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('9fdff8ce-1919-7caa-737d-706429b29f4f', 'f8ebd260-26e6-1f1e-5f41-23f4d052e960', '9239ec2e-0e14-e8a4-d0cb-13214439327c', 'Normal', 1, 60000.0, 26000.0, 60000.0, 26000.0) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('e5e99864-0705-6551-2acd-6a8c6375b40e', 'f8ebd260-26e6-1f1e-5f41-23f4d052e960', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 3, 10000.0, 6929.34, 30000.0, 20788.02) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('18d64180-c568-824c-af4a-05fc3482063d', 'f8ebd260-26e6-1f1e-5f41-23f4d052e960', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 2, 10000.0, 7400.77, 20000.0, 14801.54) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('acf93461-5a92-3f1c-c54f-b553ed74ba49', 'f8ebd260-26e6-1f1e-5f41-23f4d052e960', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 1, 10000.0, 5695.45, 10000.0, 5695.45) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('f62a962d-cce4-c6c5-de6e-31102cb080b6', 'PO-20260930-OTHER', 'Pre-Order General', 'OTHER', '2026-09-30', 'COMPLETED', 'LUNAS', 'CASH', 285000.0, 189710.8, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('39451140-ee22-1050-76bc-5773862be6c9', 'f62a962d-cce4-c6c5-de6e-31102cb080b6', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 10, 10000.0, 7400.77, 100000.0, 74007.7) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('beacceec-650b-9cc4-52e1-5a41bb453d65', 'f62a962d-cce4-c6c5-de6e-31102cb080b6', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 10, 10000.0, 6929.34, 100000.0, 69293.4) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('cf2e466f-0156-4c60-6aec-6dd074daf076', 'f62a962d-cce4-c6c5-de6e-31102cb080b6', '26acad3c-77f8-05fb-947e-fb98f141b29c', 'Normal', 5, 7000.0, 3586.49, 35000.0, 17932.45) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('853589d9-23d4-0e74-2ef8-74ee75e70bce', 'f62a962d-cce4-c6c5-de6e-31102cb080b6', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 5, 10000.0, 5695.45, 50000.0, 28477.25) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('aa329614-951c-3b11-8f73-1515bb20e59d', 'PO-20261001-BAF', 'PT Bank BAF', 'BAF', '2026-10-01', 'COMPLETED', 'LUNAS', 'CASH', 87000.0, 57024.86, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('0d7f37be-7982-ff94-6102-d82d93afc84a', 'aa329614-951c-3b11-8f73-1515bb20e59d', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 1, 10000.0, 7400.77, 10000.0, 7400.77) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('34a507b7-1c9a-e087-d026-eac2adfafb4a', 'aa329614-951c-3b11-8f73-1515bb20e59d', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 5, 10000.0, 6929.34, 50000.0, 34646.7) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('fee9c2d1-b174-e02a-1bad-0e56f5de7398', 'aa329614-951c-3b11-8f73-1515bb20e59d', '26acad3c-77f8-05fb-947e-fb98f141b29c', 'Normal', 1, 7000.0, 3586.49, 7000.0, 3586.49) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('0fbb83a8-7153-87ee-eab9-fae4859e1fe5', 'aa329614-951c-3b11-8f73-1515bb20e59d', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 2, 10000.0, 5695.45, 20000.0, 11390.9) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('1645231f-2e59-959c-fef8-0422fbf666cb', 'PO-20261001-BNPP', 'Badan Pengelola Keuangan (BNPP)', 'BNPP', '2026-10-01', 'COMPLETED', 'LUNAS', 'CASH', 50000.0, 32650.35, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('2feca49f-6b29-5bcf-a08e-100fee836c50', '1645231f-2e59-959c-fef8-0422fbf666cb', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 1, 10000.0, 7400.77, 10000.0, 7400.77) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('b8802d67-d430-fde0-3eac-87d6be4a29e1', '1645231f-2e59-959c-fef8-0422fbf666cb', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 2, 10000.0, 6929.34, 20000.0, 13858.68) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('6e6c29d1-dc0f-c52e-099b-4b913af2d56b', '1645231f-2e59-959c-fef8-0422fbf666cb', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 2, 10000.0, 5695.45, 20000.0, 11390.9) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('ba6eda43-d20f-831d-de95-a93eefdcd723', 'PO-20261005-BNPP', 'Badan Pengelola Keuangan (BNPP)', 'BNPP', '2026-10-05', 'COMPLETED', 'LUNAS', 'CASH', 240000.0, 106000.0, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('cf7a1ccf-d64a-ac6a-1d5f-30f9fd3c847c', 'ba6eda43-d20f-831d-de95-a93eefdcd723', '8a62ef7b-f736-a3eb-bb96-ce04ddd9de80', 'Normal', 1, 60000.0, 28000.0, 60000.0, 28000.0) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('115ea0bb-d014-e98b-30bf-9a9794542eb7', 'ba6eda43-d20f-831d-de95-a93eefdcd723', '9239ec2e-0e14-e8a4-d0cb-13214439327c', 'Normal', 3, 60000.0, 26000.0, 180000.0, 78000.0) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('1d61aa31-0f36-a5a0-6a56-f10631c540aa', 'PO-20261006-BNPP', 'Badan Pengelola Keuangan (BNPP)', 'BNPP', '2026-10-06', 'COMPLETED', 'LUNAS', 'CASH', 87000.0, 43916.6, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('eb1ae49b-65d6-1434-e76c-7302496bcca1', '1d61aa31-0f36-a5a0-6a56-f10631c540aa', '9239ec2e-0e14-e8a4-d0cb-13214439327c', 'Normal', 1, 60000.0, 26000.0, 60000.0, 26000.0) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('831b89b0-297e-0ebe-20c4-9aa2f756b0cf', '1d61aa31-0f36-a5a0-6a56-f10631c540aa', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 1, 10000.0, 7400.77, 10000.0, 7400.77) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('1dccd1ea-9108-d701-a974-a8d1bda83245', '1d61aa31-0f36-a5a0-6a56-f10631c540aa', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 1, 10000.0, 6929.34, 10000.0, 6929.34) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('fd78b0e7-a8c0-218a-42e2-e7db4de91625', '1d61aa31-0f36-a5a0-6a56-f10631c540aa', '26acad3c-77f8-05fb-947e-fb98f141b29c', 'Normal', 1, 7000.0, 3586.49, 7000.0, 3586.49) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('fc35c430-7906-9e86-c10b-3d74c1ec0898', 'PO-20261007-OTHER', 'Pre-Order General', 'OTHER', '2026-10-07', 'COMPLETED', 'LUNAS', 'CASH', 137000.0, 87498.46, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('1ed97fa1-6a07-6e9b-ddcd-4b7e647356b3', 'fc35c430-7906-9e86-c10b-3d74c1ec0898', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 5, 10000.0, 5695.45, 50000.0, 28477.25) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('fcd3c3b2-993e-c1a6-4589-84688677c78f', 'fc35c430-7906-9e86-c10b-3d74c1ec0898', '26acad3c-77f8-05fb-947e-fb98f141b29c', 'Normal', 1, 7000.0, 3586.49, 7000.0, 3586.49) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('a4614a6c-093a-b757-921c-93d345894548', 'fc35c430-7906-9e86-c10b-3d74c1ec0898', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 8, 10000.0, 6929.34, 80000.0, 55434.72) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('bcfc11cb-3710-22c1-9549-f470aaedb5bf', 'PO-20261008-BAF', 'PT Bank BAF', 'BAF', '2026-10-08', 'COMPLETED', 'LUNAS', 'CASH', 137000.0, 91671.56, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('0673381c-4e24-8720-da26-d0bc26eaeaef', 'bcfc11cb-3710-22c1-9549-f470aaedb5bf', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 2, 10000.0, 5695.45, 20000.0, 11390.9) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('54d45b85-70f9-d8b7-8fd8-9bd073b19f92', 'bcfc11cb-3710-22c1-9549-f470aaedb5bf', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 1, 10000.0, 7400.77, 10000.0, 7400.77) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('61842ae2-e6c1-1bf7-8166-2d52ec06ce85', 'bcfc11cb-3710-22c1-9549-f470aaedb5bf', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 10, 10000.0, 6929.34, 100000.0, 69293.4) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('a03f5fcd-f3ec-bee6-49cd-e88068477fd7', 'bcfc11cb-3710-22c1-9549-f470aaedb5bf', '26acad3c-77f8-05fb-947e-fb98f141b29c', 'Normal', 1, 7000.0, 3586.49, 7000.0, 3586.49) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('5c528215-d41e-e014-92cf-780bea9a620e', 'PO-20261008-BNPP', 'Badan Pengelola Keuangan (BNPP)', 'BNPP', '2026-10-08', 'COMPLETED', 'LUNAS', 'CASH', 40000.0, 27426.33, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('ade29522-278e-2826-d000-3a784e9ed479', '5c528215-d41e-e014-92cf-780bea9a620e', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 1, 10000.0, 5695.45, 10000.0, 5695.45) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('c5d0df4b-1e06-0d1f-11a7-8c80e61b6a26', '5c528215-d41e-e014-92cf-780bea9a620e', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 2, 10000.0, 7400.77, 20000.0, 14801.54) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('d6358412-26e1-9a87-3043-59000f8f0197', '5c528215-d41e-e014-92cf-780bea9a620e', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 1, 10000.0, 6929.34, 10000.0, 6929.34) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO orders (id, order_number, customer_name, segment, delivery_date, status, payment_status, payment_method, total_amount, total_hpp, notes) VALUES ('699e7fca-243b-6b2d-9344-f8cd3c8eca7b', 'PO-20261009-BAF', 'PT Bank BAF', 'BAF', '2026-10-09', 'COMPLETED', 'LUNAS', 'CASH', 164000.0, 108534.67, 'Imported from Excel PO') ON CONFLICT (order_number) DO UPDATE SET customer_name = EXCLUDED.customer_name, total_amount = EXCLUDED.total_amount, total_hpp = EXCLUDED.total_hpp;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('2ffba3cd-603f-f259-ea20-db1d8d6289be', '699e7fca-243b-6b2d-9344-f8cd3c8eca7b', 'fa99607c-8c2d-3525-ca58-47a57f12d199', 'Normal', 4, 10000.0, 5695.45, 40000.0, 22781.8) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('80952eb6-2e4b-8a5a-ee31-12a60cae2026', '699e7fca-243b-6b2d-9344-f8cd3c8eca7b', 'bf762630-4e62-3283-8b09-504e50339de3', 'Normal', 5, 10000.0, 7400.77, 50000.0, 37003.85) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('c83948a8-c271-1177-de0a-d114c0a75a1e', '699e7fca-243b-6b2d-9344-f8cd3c8eca7b', '09e652e1-2410-28b6-3392-17ce2620b99c', 'Normal', 6, 10000.0, 6929.34, 60000.0, 41576.04) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;
INSERT INTO order_items (id, order_id, variant_id, sugar_level, quantity, unit_price, unit_hpp, subtotal, subtotal_hpp) VALUES ('33ed987f-a57e-267e-ecca-f9f21527eadc', '699e7fca-243b-6b2d-9344-f8cd3c8eca7b', '26acad3c-77f8-05fb-947e-fb98f141b29c', 'Normal', 2, 7000.0, 3586.49, 14000.0, 7172.98) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal;

-- =============================================================================
-- 9. SEED: JOURNAL ENTRIES & ITEMS (from JURNAL TRANSAKSI)
-- =============================================================================
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('b61c7f4c-06db-95cd-423b-d19ffaae73c8', '2026-01-10', 'Penerimaan PO 1 Oktober', 'JU-20260110-001') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('708d164f-5236-4aca-e38c-3e410a4a5421', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '101', 20000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('a74ce8df-67ad-c2d4-d43e-102be72619d8', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '401', 0.0, 20000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('9a6cd70f-4a63-8a12-45d4-1a57b4643dde', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '101', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('af70231d-06f9-d89d-aac7-eec632d933fd', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '401', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('68535061-da4a-172e-1003-68da28344dec', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '101', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('927a3e29-e0c2-caae-6a1c-c9da21915d02', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '401', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('592d3187-e362-b2a7-5e73-33b9e3723c10', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '101', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('1eceb57e-c1a7-55b0-38b7-30061b994cd8', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '401', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('817b913c-a075-2570-9ef6-4bf6b2baba7c', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '101', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2b85487b-93a7-95e1-d9da-381b5f7d1621', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '401', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('bac59021-6d42-8d36-e678-c5b1b54114ed', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '101', 20000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('b7044d33-ba87-5d02-cca9-9359a52b19f9', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '401', 0.0, 20000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d20ab236-2af8-75f5-6a62-67d461c9eb52', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '101', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ddc84080-43be-9855-3d9f-292130fb35c6', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '401', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('3e169b0a-7f9c-40c5-2d6e-fdcd282ccfa2', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '101', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('1470b6ac-5c8c-046c-4c2b-92da82031692', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '401', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('db07f0e6-2ea7-18c3-44cd-c47128e9b164', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '101', 7000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('efbe5b20-6605-1e73-c970-6eb2ca1c4cad', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '401', 0.0, 7000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e24842e9-c757-f332-32fa-e03e9cf2596a', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '101', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('58f1513c-2db5-9046-8168-450915f57b15', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '401', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('5c6f7326-0c68-0619-39fc-20a997a2a0c8', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '101', 20000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e10d0114-9690-26a1-a673-d71e143bd25e', 'b61c7f4c-06db-95cd-423b-d19ffaae73c8', '401', 0.0, 20000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('44f0446d-13d6-eebc-ab59-be8edb79a7b7', '2026-02-10', 'Penerimaan DP Mbak Ninik 5 Oktober', 'JU-20260210-002') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('7e26096f-0fce-f3be-27b9-8761ab701fc4', '44f0446d-13d6-eebc-ab59-be8edb79a7b7', '101', 165000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('1d8b6c87-a494-d492-0caf-296601eed313', '44f0446d-13d6-eebc-ab59-be8edb79a7b7', '401', 0.0, 165000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('206a56dd-6b3a-c1e3-fa22-5d280cc369ed', '2026-04-10', 'Pembuatan PO 1 Oktober', 'JU-20260410-003') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('fbe56769-67d0-a380-422a-9a99c21f1bd6', '206a56dd-6b3a-c1e3-fa22-5d280cc369ed', '501', 137000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c224149f-11bd-11b9-0442-eec53c656572', '206a56dd-6b3a-c1e3-fa22-5d280cc369ed', '102', 0.0, 20000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('886a7a1e-810c-0949-ebc3-b1df88d84256', '206a56dd-6b3a-c1e3-fa22-5d280cc369ed', '102', 0.0, 2560.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c6dadd82-2585-1076-25cd-b45fabd385e2', '206a56dd-6b3a-c1e3-fa22-5d280cc369ed', '102', 0.0, 5029.3737) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d9bcdc47-a135-247e-4916-f9982b981fff', '206a56dd-6b3a-c1e3-fa22-5d280cc369ed', '102', 0.0, 3247.6562) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d5353ba1-9ff7-158c-a876-50e3a8182aef', '206a56dd-6b3a-c1e3-fa22-5d280cc369ed', '102', 0.0, 9671.97) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d8aedab5-67bb-e381-bf96-908c99d60093', '206a56dd-6b3a-c1e3-fa22-5d280cc369ed', '102', 0.0, 2400.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('6283e13c-0709-bf6b-7eff-24c975985f74', '206a56dd-6b3a-c1e3-fa22-5d280cc369ed', '201', 0.0, 94091.0001) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('f5246c80-ad31-4c77-6b0d-1eeb8ceb6dd4', '2026-05-10', 'Pembelian Es Batu', 'JU-20260510-004') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('05a582f2-9293-1b88-fea2-478eacd2bcf5', 'f5246c80-ad31-4c77-6b0d-1eeb8ceb6dd4', '501', 5000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d1fbd040-7bca-56ca-0bb9-3e93caccd537', 'f5246c80-ad31-4c77-6b0d-1eeb8ceb6dd4', '101', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('d68a8846-3665-34ab-eeb7-0761eb5fd738', '2026-05-10', 'Pembelian Kopi Kapal Api 6g', 'JU-20260510-005') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('93fe63de-a36d-b235-ac69-3765b41a4ba2', 'd68a8846-3665-34ab-eeb7-0761eb5fd738', '102', 20765.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('e0112919-04d1-28c4-569d-e02dd3dcd6e9', '2026-05-10', 'Pembelian Krimer Krim Cafe 500g', 'JU-20260510-006') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('dcb1f2b3-3560-ad48-002c-67fd3490d4d2', 'e0112919-04d1-28c4-569d-e02dd3dcd6e9', '102', 65520.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('3a966806-eb7f-cc71-302b-bc82fc5da11d', '2026-05-10', 'Pembelian Persediaan', 'JU-20260510-007') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ef3bbb2d-0aae-37fe-87c7-d446f1049b54', '3a966806-eb7f-cc71-302b-bc82fc5da11d', '101', 0.0, 342260.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('e2fad013-052a-8407-4d4c-bb757d21c560', '2026-05-10', 'Pembelian Susu UHT Grandairy 1L', 'JU-20260510-008') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('4345c93f-208b-00c6-d261-fb124b7ffa49', 'e2fad013-052a-8407-4d4c-bb757d21c560', '102', 251775.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('753e8403-e477-b361-b3f3-958b6c0a2af6', '2026-05-10', 'Pembelian Tooth Bag', 'JU-20260510-009') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ee6b8690-3c0e-8f80-ac89-00db82b0d3d1', '753e8403-e477-b361-b3f3-958b6c0a2af6', '601', 4200.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('3672da40-4dda-7f88-f665-07aa371728a5', '2026-05-10', 'Pembuatan PO 1 Oktober', 'JU-20260510-010') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('71c4a8f7-4227-f3ba-02a6-a480713d63c7', '3672da40-4dda-7f88-f665-07aa371728a5', '501', 62320.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('139a5b1e-e411-7cd7-b1fd-e494d0bad931', '3672da40-4dda-7f88-f665-07aa371728a5', '102', 0.0, 3828.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('649c7eed-c0ef-6093-51e2-c61dae145c43', '3672da40-4dda-7f88-f665-07aa371728a5', '102', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('9b53191f-483d-570e-aa8e-a3008274f4d2', '3672da40-4dda-7f88-f665-07aa371728a5', '102', 0.0, 2560.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('3642b397-dc78-7c33-84ce-cd6ca5c827b4', '3672da40-4dda-7f88-f665-07aa371728a5', '102', 0.0, 13595.85) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c9847973-f4b9-5926-cc67-47c1b1678d99', '3672da40-4dda-7f88-f665-07aa371728a5', '102', 0.0, 454.6719) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('1917c047-3ee1-305f-bb15-5897eacf815e', '3672da40-4dda-7f88-f665-07aa371728a5', '102', 0.0, 7338.24) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('65f54e1c-56e5-93b1-8184-ef3432b92c85', '3672da40-4dda-7f88-f665-07aa371728a5', '201', 0.0, 29543.2381) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('b9ae9f19-05ab-7881-8d74-4e345cd9f2ac', '2026-06-10', 'Penerimaan PO 6 Oktober', 'JU-20260610-011') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('840fcf85-2dab-baf7-e8bd-28b4d1f94ccf', 'b9ae9f19-05ab-7881-8d74-4e345cd9f2ac', '101', 15000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('aedcb061-c5df-145c-98da-3e1b45678903', 'b9ae9f19-05ab-7881-8d74-4e345cd9f2ac', '401', 0.0, 15000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('1244a7a9-6e0f-b5c0-f91e-9042037a80cb', 'b9ae9f19-05ab-7881-8d74-4e345cd9f2ac', '101', 17000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('8a26a467-957e-66b3-267c-45a97e998611', 'b9ae9f19-05ab-7881-8d74-4e345cd9f2ac', '401', 0.0, 17000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('7bc21c6c-26cf-3940-2435-fc63d4f01d79', 'b9ae9f19-05ab-7881-8d74-4e345cd9f2ac', '101', 60000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('22664a58-1858-fd23-7663-8b224540493a', 'b9ae9f19-05ab-7881-8d74-4e345cd9f2ac', '401', 0.0, 60000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('7180372e-e189-e607-ee61-2de572fe2e77', '2026-07-10', 'Pembayaran Gosend Stiker', 'JU-20260710-012') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ae5af8c7-3d6d-88b7-4f72-d6290c40e0d0', '7180372e-e189-e607-ee61-2de572fe2e77', '501', 14000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('41bba603-0fa0-02ac-9b82-bab26ff22230', '7180372e-e189-e607-ee61-2de572fe2e77', '101', 0.0, 14000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('fabce668-c467-8683-8dfc-86a46cd7ab88', '2026-07-10', 'Pembelian Es Batu', 'JU-20260710-013') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('6a996553-0c4c-e702-aaee-e85fae7edd44', 'fabce668-c467-8683-8dfc-86a46cd7ab88', '501', 5000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c47eec14-0348-9410-7b80-203945817ee9', 'fabce668-c467-8683-8dfc-86a46cd7ab88', '101', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('11bf4905-83e2-137d-0eac-60046d7ca091', '2026-07-10', 'Pembelian Stiker Produk 80 Pcs', 'JU-20260710-014') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2af2437b-8c84-8867-6fcd-7e7d662883b1', '11bf4905-83e2-137d-0eac-60046d7ca091', '102', 56027.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f55fe91b-dbcf-35af-0729-f45db11839e3', '11bf4905-83e2-137d-0eac-60046d7ca091', '101', 0.0, 56027.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('a62701f7-ee1d-bc5b-5d62-241c16243e0d', '2026-07-10', 'Pembuatan PO 7 Oktober', 'JU-20260710-015') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('9ea46b6a-3e4d-eb36-ee7e-f820b4d53aac', 'a62701f7-ee1d-bc5b-5d62-241c16243e0d', '501', 86498.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('db51303b-317c-aacb-e907-3cb052878be5', 'a62701f7-ee1d-bc5b-5d62-241c16243e0d', '102', 0.0, 13398.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e43fdcc4-931b-2209-5d0d-663a7a52e689', 'a62701f7-ee1d-bc5b-5d62-241c16243e0d', '102', 0.0, 2076.5) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('4ac6e28c-827f-af79-85e3-6fbeec5308e9', 'a62701f7-ee1d-bc5b-5d62-241c16243e0d', '102', 0.0, 6400.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('a59e7e2d-62e0-c101-e25e-b7b395d37522', 'a62701f7-ee1d-bc5b-5d62-241c16243e0d', '102', 0.0, 15928.965) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('27328d12-1fe1-8a77-2616-c2b2558ee6a5', 'a62701f7-ee1d-bc5b-5d62-241c16243e0d', '102', 0.0, 9696.96) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('a636d8b2-b4fb-73f2-e7d0-8b687484f17c', 'a62701f7-ee1d-bc5b-5d62-241c16243e0d', '201', 0.0, 38997.575) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('82ffa615-c803-f656-cc86-90b45b3020f8', 'a62701f7-ee1d-bc5b-5d62-241c16243e0d', '201', 0.0, 87209.5824) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('3ef4bee3-d547-4b0c-26d5-e85c716d7032', '2026-07-10', 'Pembuatan PO 8 & 9 Oktober', 'JU-20260710-016') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0dde62d3-e25d-7a48-0658-d479ea772251', '3ef4bee3-d547-4b0c-26d5-e85c716d7032', '501', 203156.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('5bb6f768-b996-cd25-572e-9c612f34d9bf', '3ef4bee3-d547-4b0c-26d5-e85c716d7032', '102', 0.0, 30624.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2e38ab8a-4fc2-8379-67a8-6a8e0c9f6f23', '3ef4bee3-d547-4b0c-26d5-e85c716d7032', '102', 0.0, 2076.5) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('8ccd4574-1ed4-c0be-f427-ffd25fc63f9e', '3ef4bee3-d547-4b0c-26d5-e85c716d7032', '102', 0.0, 22410.8) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('74d6b86b-e703-da37-60b4-4952e7db218d', '3ef4bee3-d547-4b0c-26d5-e85c716d7032', '102', 0.0, 40132.935) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c739bfa9-f032-0fa1-4889-00c8c55f9a56', '3ef4bee3-d547-4b0c-26d5-e85c716d7032', '102', 0.0, 4914.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('fd2a934f-ecc8-e892-dd8d-fee29cf7a686', '3ef4bee3-d547-4b0c-26d5-e85c716d7032', '102', 0.0, 3247.6562) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('cb783a46-c7a2-0ece-a700-ad46b39db127', '3ef4bee3-d547-4b0c-26d5-e85c716d7032', '102', 0.0, 2157.193) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('3dee5a62-4c27-c2a7-436d-50fb4d93ffdf', '3ef4bee3-d547-4b0c-26d5-e85c716d7032', '102', 0.0, 10383.3333) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('f4b0ada6-89c0-ac45-4444-162239a0dd6d', '2026-07-10', 'Penerimaan PO 7 Oktober', 'JU-20260710-017') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('cd0a4cb3-9eff-b2b7-a22b-68d764ddbeb3', 'f4b0ada6-89c0-ac45-4444-162239a0dd6d', '101', 137000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('a2308eab-7db3-95e1-153f-5a43df4c98fe', 'f4b0ada6-89c0-ac45-4444-162239a0dd6d', '401', 0.0, 137000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('5c93683e-3a45-963d-1a64-88defc1ef361', '2026-07-10', 'Reimburse Pembelian Es Batu 5 Oktober', 'JU-20260710-018') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e701e0d0-cd6e-74fa-33a1-bc1dbeef78ca', '5c93683e-3a45-963d-1a64-88defc1ef361', '501', 5000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('149b8ccc-c73d-af9b-2d27-4487e095c5bb', '5c93683e-3a45-963d-1a64-88defc1ef361', '101', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('04a5ac40-cf52-d7d2-0347-447f318ad8c1', '2026-08-10', 'Pembelian Chocodrink 2 pouch', 'JU-20260810-019') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('71064d9c-a57f-e003-d781-39e7cb783b26', '04a5ac40-cf52-d7d2-0347-447f318ad8c1', '102', 17800.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2298b972-d0f0-6c27-29d5-f9df7a550440', '04a5ac40-cf52-d7d2-0347-447f318ad8c1', '101', 0.0, 17800.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('c075831f-0e4b-522e-8d8a-71cd55ab5b16', '2026-08-10', 'Pembelian Es Batu', 'JU-20260810-020') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e11c4f96-6b0a-93b5-00b8-d04b9a242899', 'c075831f-0e4b-522e-8d8a-71cd55ab5b16', '501', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f95cef02-e6c8-d47c-4d9b-c32a562d6629', 'c075831f-0e4b-522e-8d8a-71cd55ab5b16', '101', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('f18c23ce-9cbd-5d8a-dcac-9c281e977d55', '2026-08-10', 'Pembelian Thermal Bag 6 Pcs', 'JU-20260810-021') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('99c2df4c-795c-8e88-e868-f7d3133a6765', 'f18c23ce-9cbd-5d8a-dcac-9c281e977d55', '601', 46500.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('62bc66d5-ee31-a434-4a2f-4006ec76bd56', 'f18c23ce-9cbd-5d8a-dcac-9c281e977d55', '101', 0.0, 46500.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('a87fdb31-571d-12d8-51b4-51f45444f429', '2026-09-10', 'Pembelian Kapal Api Biru', 'JU-20260910-022') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('eec94dd2-f24b-df53-2d72-aa000986a888', 'a87fdb31-571d-12d8-51b4-51f45444f429', '102', 12500.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('992b35da-989f-3100-289f-1a1becee4a4c', 'a87fdb31-571d-12d8-51b4-51f45444f429', '101', 0.0, 12500.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('16e324f8-837c-2654-03aa-a93c9c3e1d47', '2026-09-10', 'Penerimaan PO 8 Oktober', 'JU-20260910-023') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('dbd42258-fa8d-847c-86a2-d5db9880f304', '16e324f8-837c-2654-03aa-a93c9c3e1d47', '101', 167000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0c4d7c45-8260-41a6-66e5-efd3b10ebfe4', '16e324f8-837c-2654-03aa-a93c9c3e1d47', '401', 0.0, 167000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('f4b04907-f080-616d-e47d-dd00ae582bdd', '2026-09-10', 'Penerimaan PO 9 Oktober', 'JU-20260910-024') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ce23e94c-c8b1-172e-5604-f1f66f9ba848', 'f4b04907-f080-616d-e47d-dd00ae582bdd', '101', 164000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d3319542-4e43-ee3a-819b-f6fd692324ac', 'f4b04907-f080-616d-e47d-dd00ae582bdd', '401', 0.0, 164000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('91f4186c-936f-a4bb-2ccb-67f8af38ee79', '2026-09-13', 'Pembelian Botol 100 Pcs', 'JU-20260913-025') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('276608f1-5cbc-32cd-3421-c6173e9f582c', '91f4186c-936f-a4bb-2ccb-67f8af38ee79', '102', 96101.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('61191808-cfdd-ad57-5e03-607e5baedbca', '91f4186c-936f-a4bb-2ccb-67f8af38ee79', '201', 0.0, 96101.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('a60c6da9-1cce-c243-411f-39db7cb1c10f', '2026-09-13', 'Pembelian Sirup GKC 400ml', 'JU-20260913-026') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('79a45be4-e18b-8919-50ed-e50c936e2f5f', 'a60c6da9-1cce-c243-411f-39db7cb1c10f', '102', 29118.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('a0af6da1-29f9-ee25-bb0d-c6f8e3be6334', 'a60c6da9-1cce-c243-411f-39db7cb1c10f', '201', 0.0, 29118.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('a83632ed-0921-71a3-a186-dd566607ace8', '2026-09-13', 'Penerimaan Penjualan CFD 13 September', 'JU-20260913-027') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('715a1825-5766-e184-977a-e14763dd8fd3', 'a83632ed-0921-71a3-a186-dd566607ace8', '401', 0.0, 100000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('0198e4a8-a35d-5a1b-d481-4ced0d99cf9b', '2026-09-13', 'Penerimaan Penjualan CFD 13 September (Cash 10rb)', 'JU-20260913-028') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('5a4d5581-33e7-c879-87d8-00b8d332d0a3', '0198e4a8-a35d-5a1b-d481-4ced0d99cf9b', '101', 100000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('5814339d-1306-4150-dd1f-ec3324bfbcd8', '2026-09-13', 'Penyetoran Modal Awal', 'JU-20260913-029') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('4edad409-946c-8271-0b3b-bc0449dbc26c', '5814339d-1306-4150-dd1f-ec3324bfbcd8', '601', 302090.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('3fce78c1-dedf-61a8-d319-d481f6820909', '5814339d-1306-4150-dd1f-ec3324bfbcd8', '501', 78010.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d9444140-49c3-0192-bea6-35641bf207f1', '5814339d-1306-4150-dd1f-ec3324bfbcd8', '103', 288900.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0041b9c5-8a6a-a053-1e9d-6a83cd7db55d', '5814339d-1306-4150-dd1f-ec3324bfbcd8', '301', 0.0, 669000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('e2150988-6032-d2c8-f565-5057c69d108c', '2026-09-15', 'Pembelian Es Batu', 'JU-20260915-030') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e4df570f-48c0-a7ba-8035-1dc237f07bbf', 'e2150988-6032-d2c8-f565-5057c69d108c', '501', 15000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('9c9f7e2e-a6f1-a86d-853b-bc782b512587', 'e2150988-6032-d2c8-f565-5057c69d108c', '201', 0.0, 15000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('298e07c6-54da-6d28-e119-6a21c4b02a19', '2026-09-15', 'Pembelian Saringan Kopi', 'JU-20260915-031') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c42237ac-0130-3cf4-fabb-c8ba9104e38a', '298e07c6-54da-6d28-e119-6a21c4b02a19', '103', 20000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('772b7584-6b4d-4578-d2d9-c7d2f5798f88', '298e07c6-54da-6d28-e119-6a21c4b02a19', '201', 0.0, 20000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('adc04f41-ceee-9aa8-0ab4-2b899bd8b3f5', '2026-09-15', 'Pembelian Stiker Produk 100 Pcs', 'JU-20260915-032') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('7b62cebf-2a67-5771-d094-3ec3328cbe7a', 'adc04f41-ceee-9aa8-0ab4-2b899bd8b3f5', '102', 64000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d096becb-c651-51ac-7856-90fdda98e77a', 'adc04f41-ceee-9aa8-0ab4-2b899bd8b3f5', '201', 0.0, 64000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('d8c6bb1e-70a3-9e4a-6be9-a637d28fad5b', '2026-09-15', 'Pembuatan PO 16 September', 'JU-20260915-033') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('6e44bbb5-1c86-1576-a170-a55fe8c26e8f', 'd8c6bb1e-70a3-9e4a-6be9-a637d28fad5b', '501', 35353.08, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('5639c8ef-c6bc-a494-1b39-42352b2e8024', 'd8c6bb1e-70a3-9e4a-6be9-a637d28fad5b', '102', 0.0, 31713.33) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('7875d56c-cd6b-fae6-6f74-1433b74e4c70', 'd8c6bb1e-70a3-9e4a-6be9-a637d28fad5b', '102', 0.0, 3639.75) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('301c2ec7-0146-4401-dac4-e3b64fc0ce66', 'd8c6bb1e-70a3-9e4a-6be9-a637d28fad5b', '501', 167745.2533, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c9081983-4eea-c685-1be3-0bd176498262', 'd8c6bb1e-70a3-9e4a-6be9-a637d28fad5b', '201', 0.0, 167745.2533) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('aaf84642-8d32-13df-e3ed-853935f11b08', '2026-09-16', 'Penerimaan DP Jungjung 21 dan 28 September', 'JU-20260916-034') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('17e7db5a-ad04-3070-611b-eb30bf5d7603', 'aaf84642-8d32-13df-e3ed-853935f11b08', '101', 110000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('14c90a60-ebbd-c24c-8801-ee12e657cb96', 'aaf84642-8d32-13df-e3ed-853935f11b08', '401', 0.0, 110000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('b62da4d5-2197-05fc-36b0-64fd5b4a837e', '2026-09-16', 'Penerimaan Penjualan PO 16 September', 'JU-20260916-035') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0df3d60f-f283-a7f5-041b-c620565bb0f0', 'b62da4d5-2197-05fc-36b0-64fd5b4a837e', '101', 207000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('76c4c25c-4283-8e21-1020-09a4e0e6ae80', 'b62da4d5-2197-05fc-36b0-64fd5b4a837e', '401', 0.0, 207000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('1ecb3e39-b3a4-4a11-2550-01c283547b0d', '2026-09-17', 'Pembuatan PO 18 September', 'JU-20260917-036') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('db7e04bb-6e1a-9c6c-14d2-1382e832f7dc', '1ecb3e39-b3a4-4a11-2550-01c283547b0d', '501', 17504.0064, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c1c015c7-0e1a-89fc-5f7f-261260e1990b', '1ecb3e39-b3a4-4a11-2550-01c283547b0d', '102', 0.0, 2883.03) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('8416f2e7-5d0f-6855-0673-55644e5ca150', '1ecb3e39-b3a4-4a11-2550-01c283547b0d', '102', 0.0, 509.565) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('b63be825-ae24-0d9c-d311-e12cf21b35fc', '1ecb3e39-b3a4-4a11-2550-01c283547b0d', '102', 0.0, 1920.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('fec05aff-0423-6a1a-a560-9482494e8491', '1ecb3e39-b3a4-4a11-2550-01c283547b0d', '201', 0.0, 12191.4114) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('cbfbc248-4727-5158-5952-0183af291dac', '2026-09-17', 'Penerimaan PO 16 September', 'JU-20260917-037') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('3e2f06aa-849c-c1ff-35d6-d68b7ff1fcc3', 'cbfbc248-4727-5158-5952-0183af291dac', '101', 120000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d2690475-b830-a987-c95c-063de91e361b', 'cbfbc248-4727-5158-5952-0183af291dac', '401', 0.0, 120000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('40c0e3ea-aede-bfd1-b2f3-b4a172966409', '2026-09-18', 'Penerimaan DP Dasen 21 September', 'JU-20260918-038') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ac7168a6-5d2c-e833-8a93-637cc389ad70', '40c0e3ea-aede-bfd1-b2f3-b4a172966409', '401', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('ace2be97-f041-06ec-e719-6eefc34422a1', '2026-09-18', 'Penerimaan DP Dasen 21 September (Cash)', 'JU-20260918-039') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('bb4c942b-daad-f1e9-00e3-b7982733515e', 'ace2be97-f041-06ec-e719-6eefc34422a1', '101', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('92ae1c9a-5417-b5bc-14c9-2616a622ec83', '2026-09-18', 'Penerimaan DP Kak Okta 30 September', 'JU-20260918-040') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('798eac98-e186-74db-8e48-71f20c961e25', '92ae1c9a-5417-b5bc-14c9-2616a622ec83', '101', 76950.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2d523cec-d6c0-cfee-47f8-48bb64961a4d', '92ae1c9a-5417-b5bc-14c9-2616a622ec83', '401', 0.0, 76950.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('00b75ace-3b11-58a8-89a5-3d3e083b0e58', '2026-09-18', 'Penerimaan PO 18 September', 'JU-20260918-041') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('11707ccf-ffa3-54c5-7600-f23203c6e327', '00b75ace-3b11-58a8-89a5-3d3e083b0e58', '401', 0.0, 7000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('ba831af5-c4b1-57e9-1b2b-742ac9078097', '2026-09-18', 'Penerimaan PO 18 September (Cash)', 'JU-20260918-042') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('927fef6b-f687-e7d2-41c2-7aac3eabfe58', 'ba831af5-c4b1-57e9-1b2b-742ac9078097', '101', 7000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('af5aa290-c471-915a-4f9b-620d43be5813', '2026-09-19', 'Pembelian Bahan Jualan CFD 20 September', 'JU-20260919-043') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('60321f2e-94e9-1391-b0ec-167f80d7f744', 'af5aa290-c471-915a-4f9b-620d43be5813', '201', 0.0, 58830.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('ce2d684c-f6bf-e8da-1b66-412592b1a9ef', '2026-09-19', 'Pembelian Banner', 'JU-20260919-044') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('39d44f51-6b4b-219a-4e77-531df3acc282', 'ce2d684c-f6bf-e8da-1b66-412592b1a9ef', '103', 17000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d29a01f9-6db6-336f-8cc9-03a518fa50fb', 'ce2d684c-f6bf-e8da-1b66-412592b1a9ef', '201', 0.0, 17000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('7992bf83-a0e5-75fc-c2e1-1c6b0b707f53', '2026-09-19', 'Pembelian Es Batu Jualan CFD 20 September 1', 'JU-20260919-045') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('74ed56e7-19b8-9319-301e-b52a709816a6', '7992bf83-a0e5-75fc-c2e1-1c6b0b707f53', '501', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c1ff5f9b-a0dd-9e84-2d87-dc01d1ba4ead', '7992bf83-a0e5-75fc-c2e1-1c6b0b707f53', '201', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('f3017c01-42e6-babe-3b45-47f4eda41758', '2026-09-19', 'Pembelian Serbet', 'JU-20260919-046') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('46127d10-8c74-6d78-0b10-981fd5998f52', 'f3017c01-42e6-babe-3b45-47f4eda41758', '103', 11150.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('a66078dd-471e-de36-81f0-f79641f8a724', '2026-09-19', 'Pembelian Susu Bendera', 'JU-20260919-047') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('5eb432b0-8af0-0ba3-3052-ae5616b434f2', 'a66078dd-471e-de36-81f0-f79641f8a724', '102', 8480.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('dbf646e3-e52a-657d-28c8-5dc61233055e', '2026-09-19', 'Pembelian Susu Nobo 200ml 2 pcs', 'JU-20260919-048') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('bc0668b4-8656-82b8-d69d-9dbe6baa8224', 'dbf646e3-e52a-657d-28c8-5dc61233055e', '601', 5000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('1c5b4d36-1836-599a-63aa-4ee7d2db6a52', '2026-09-19', 'Pembelian Susu UHT Indomilk 950ml', 'JU-20260919-049') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('14ec3092-50d3-c86d-dec1-a997db4d09f1', '1c5b4d36-1836-599a-63aa-4ee7d2db6a52', '102', 34200.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('2c52f14d-8bfd-8701-d51e-de3c11488b48', '2026-09-19', 'Pembuatan Jualan CFD 20 & PO 21 September', 'JU-20260919-050') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('8f870319-2ef2-0e72-9cf9-010fd4dc8e5e', '2c52f14d-8bfd-8701-d51e-de3c11488b48', '501', 113226.5133, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('cd01dbca-8943-0381-b788-b0934941c67a', '2c52f14d-8bfd-8701-d51e-de3c11488b48', '102', 0.0, 17298.18) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('b3d010d5-da36-d643-2f6c-9d7dca4d3556', '2c52f14d-8bfd-8701-d51e-de3c11488b48', '102', 0.0, 3130.185) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('5b2ba4fb-8cc5-68c1-e4e1-f7e9405147d3', '2c52f14d-8bfd-8701-d51e-de3c11488b48', '102', 0.0, 11520.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('b9d36845-8b06-2943-709e-0142c427e21a', '2c52f14d-8bfd-8701-d51e-de3c11488b48', '102', 0.0, 929.8246) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0ddc46db-ed69-21b1-a80e-131f36faa505', '2c52f14d-8bfd-8701-d51e-de3c11488b48', '201', 0.0, 21915.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e5e5b12a-cd5e-f9d8-d6ed-422afe89a128', '2c52f14d-8bfd-8701-d51e-de3c11488b48', '201', 0.0, 58433.3238) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('23d869c8-3847-1785-b408-4eef48cedc86', '2026-09-20', 'Pembelian Botol 1l', 'JU-20260920-051') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('830a4ef5-d3c1-a4d0-62fd-484c6f4117ac', '23d869c8-3847-1785-b408-4eef48cedc86', '102', 25000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2f5ccfa1-66cd-cbf7-90e3-284c0a907ce4', '23d869c8-3847-1785-b408-4eef48cedc86', '201', 0.0, 25000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('c4b95881-e546-da27-5e5f-1b8f5be868e5', '2026-09-20', 'Pembelian Es Batu Jualan CFD 20 September 2', 'JU-20260920-052') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('fab0bf83-abea-1359-df80-b1f6ea4aca49', 'c4b95881-e546-da27-5e5f-1b8f5be868e5', '501', 5000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0470c588-fe17-0397-ca7d-8e068b1e1ff7', 'c4b95881-e546-da27-5e5f-1b8f5be868e5', '201', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('ae0f9182-b077-9017-eee5-4361de3857a3', '2026-09-20', 'Pembuatan PO 21 September', 'JU-20260920-053') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('a8666f27-a0a1-3f1e-beca-fd1876fed7f1', 'ae0f9182-b077-9017-eee5-4361de3857a3', '501', 5000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f7ae1401-4838-9b03-d62c-49736fe8f4bd', 'ae0f9182-b077-9017-eee5-4361de3857a3', '102', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('fde18332-813a-9c0a-0b79-c006b00543fe', '2026-09-20', 'Penerimaan Penjualan CFD 20 September', 'JU-20260920-054') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('48868828-f433-91e1-0895-4c439c53a788', 'fde18332-813a-9c0a-0b79-c006b00543fe', '101', 17000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('921c4c78-59e2-a928-4492-cef1b3afc8e6', 'fde18332-813a-9c0a-0b79-c006b00543fe', '401', 0.0, 17000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('45653eca-36b5-11f6-b9f5-88a28a06ad20', '2026-09-21', 'Pembelian Es Batu PO 21 September', 'JU-20260921-055') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('b7684a68-fef4-75a3-e310-480aac249165', '45653eca-36b5-11f6-b9f5-88a28a06ad20', '501', 5000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('6e02bd65-3fcc-9566-fbc1-669dd1424ae5', '45653eca-36b5-11f6-b9f5-88a28a06ad20', '201', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('e353e609-c203-38d6-d98d-2df5f353e610', '2026-09-21', 'Pembuatan PO 22 September', 'JU-20260921-056') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e406377f-11e3-de63-f114-9f565230a0c0', 'e353e609-c203-38d6-d98d-2df5f353e610', '501', 57406.1752, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('02a82ccb-f6b9-393a-2b96-b05a7f79293b', 'e353e609-c203-38d6-d98d-2df5f353e610', '102', 0.0, 7688.08) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('233db99a-d282-deac-f509-d298f27499f7', 'e353e609-c203-38d6-d98d-2df5f353e610', '102', 0.0, 4156.5945) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('742d3cd8-328d-71f4-7363-8ff32ba6316b', 'e353e609-c203-38d6-d98d-2df5f353e610', '102', 0.0, 5120.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('50882296-13b1-9859-07a0-8686bf5865bd', 'e353e609-c203-38d6-d98d-2df5f353e610', '102', 0.0, 12285.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f847d691-dec3-a465-f690-af9a931670b4', 'e353e609-c203-38d6-d98d-2df5f353e610', '201', 0.0, 28156.5007) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('54a1f58a-4444-c987-9a52-67caf22282f7', '2026-09-21', 'Penerimaan PO 18 September', 'JU-20260921-057') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('490365db-17db-f9a5-cbc3-e7bc5a86a166', '54a1f58a-4444-c987-9a52-67caf22282f7', '101', 20000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('abf5c55a-9a80-0de0-d07e-0f504f22deb2', '54a1f58a-4444-c987-9a52-67caf22282f7', '401', 0.0, 20000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('c1b55478-3a2c-1f00-54f3-9ff79d10ca99', '2026-09-21', 'Penerimaan PO 22 September', 'JU-20260921-058') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ad69ed2e-9f1a-a0de-96a0-de049ffac66b', 'c1b55478-3a2c-1f00-54f3-9ff79d10ca99', '101', 80000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('fc244a6a-fcf7-86c2-217a-316fbcf7b342', 'c1b55478-3a2c-1f00-54f3-9ff79d10ca99', '401', 0.0, 80000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '2026-09-22', 'Pembuatan PO 23 September', 'JU-20260922-059') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('3bdea622-b11e-eb0b-7a00-2fd1c0438c1d', '503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '501', 58549.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('7c98faaa-cc71-7313-ea6c-753e85a56b39', '503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '102', 0.0, 7688.08) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('5a4e5aaf-1501-d72d-48a3-89f948f91940', '503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '102', 0.0, 1528.695) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('01b622a5-b5da-2513-52e5-cd523cb78374', '503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '102', 0.0, 5120.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c98a26df-e9df-6a45-772d-8a7e87c39e12', '503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '102', 0.0, 12960.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c4f4e7b0-b407-5cea-ca7d-429bf4e427eb', '503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '201', 0.0, 31252.225) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('31d38b19-a2d8-605f-799f-dbdadfc92e5e', '503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '501', 32381.6667, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0b3311b2-0d93-023f-73ed-5aacb0ff326d', '503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '102', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('96004b69-7829-fc5d-bf7f-ce1f90e86ad7', '503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '102', 0.0, 640.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('6d0a8ad4-3bac-6efe-7835-c1b6d80240cf', '503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '102', 0.0, 8100.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2ce21d78-5652-1879-d29b-31e56a323b8d', '503ea0bc-cdf3-1fce-b6e7-2abeee8f1f80', '201', 0.0, 18641.6667) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('db9f0571-6425-d5e9-d62d-15036f436fd1', '2026-09-23', 'Penerimaan PO 23 September', 'JU-20260923-060') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('9e7c7008-15a4-21a9-f8fb-6413e103b08e', 'db9f0571-6425-d5e9-d62d-15036f436fd1', '101', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e599dd5a-5ef6-8ba7-3bda-0c00f9e1f14c', 'db9f0571-6425-d5e9-d62d-15036f436fd1', '401', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2ca8d83c-995f-64c2-aebf-8e1f70e5f915', 'db9f0571-6425-d5e9-d62d-15036f436fd1', '401', 0.0, 30000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('526b46e8-2f13-3f85-5247-c21f5cfa7f31', 'db9f0571-6425-d5e9-d62d-15036f436fd1', '101', 20000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('18455590-82c5-9fb3-d5d8-d821e46e0c1a', 'db9f0571-6425-d5e9-d62d-15036f436fd1', '401', 0.0, 20000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e30cd481-465f-df9a-2c0b-12fd94427d63', 'db9f0571-6425-d5e9-d62d-15036f436fd1', '101', 20000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e9761f82-e13e-0fe5-8c26-25925231f1c7', 'db9f0571-6425-d5e9-d62d-15036f436fd1', '401', 0.0, 20000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('dd00b0a2-1a95-7a70-c5ca-45e3f54de8c8', 'db9f0571-6425-d5e9-d62d-15036f436fd1', '101', 60000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f7126384-4893-f155-2a79-1ae03795fb96', 'db9f0571-6425-d5e9-d62d-15036f436fd1', '401', 0.0, 60000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('c8001d4b-675c-fa58-ead1-2b49a28a3543', '2026-09-23', 'Penerimaan PO 23 September (Cash)', 'JU-20260923-061') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('cd8229d5-1911-0fd0-7cf4-c2ac841bf8af', 'c8001d4b-675c-fa58-ead1-2b49a28a3543', '101', 30000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('cdee51d6-ea26-6bec-b341-42faae6df257', '2026-09-24', 'Pembelian Es Batu PO 25 September', 'JU-20260924-062') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d03b5b46-4f8d-b977-61da-6b7a15def268', 'cdee51d6-ea26-6bec-b341-42faae6df257', '501', 5000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ef1c6149-9f62-c630-0c96-d1cc50076fb5', 'cdee51d6-ea26-6bec-b341-42faae6df257', '101', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('aa33fa5c-d981-2512-5654-cf64a4c3e61a', '2026-09-24', 'Penerimaan PO 25 September', 'JU-20260924-063') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f2b9b500-8b72-bc6b-f16b-8bf3cf297d6c', 'aa33fa5c-d981-2512-5654-cf64a4c3e61a', '401', 0.0, 50000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('8f16aa4f-93a7-3383-3436-c83160a95934', '2026-09-24', 'Penerimaan PO 25 September (Cash)', 'JU-20260924-064') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('baa629e4-515a-9b69-ddd7-bd70e8c2cdbf', '8f16aa4f-93a7-3383-3436-c83160a95934', '101', 50000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('991faaa6-49fc-90c2-8344-251b0997bee6', '2026-09-25', 'Pembelian Makanan/Minuman', 'JU-20260925-065') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0afe75d5-5adf-898a-6b7b-9502ad150007', '991faaa6-49fc-90c2-8344-251b0997bee6', '601', 4000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('b331133b-b41b-3be0-2c41-027f99f3fab4', '991faaa6-49fc-90c2-8344-251b0997bee6', '101', 0.0, 4000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('8f240719-b0a0-48c6-c0e8-34db7fb6c37d', '2026-09-25', 'Pembuatan PO 25 September', 'JU-20260925-066') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('79869b57-edfb-5646-b5bd-a61cb9a126dc', '8f240719-b0a0-48c6-c0e8-34db7fb6c37d', '501', 106727.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e03b5e8c-ebc4-247f-b534-31c333aace5e', '8f240719-b0a0-48c6-c0e8-34db7fb6c37d', '102', 0.0, 7688.08) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('bac71d42-a5e5-0fed-7ff0-3f50ec768bf0', '8f240719-b0a0-48c6-c0e8-34db7fb6c37d', '102', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('136394db-eee3-f22a-d64b-0bda5ddf1f2d', '8f240719-b0a0-48c6-c0e8-34db7fb6c37d', '102', 0.0, 3130.185) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d591e981-5611-fefe-040b-365d80cc3869', '8f240719-b0a0-48c6-c0e8-34db7fb6c37d', '102', 0.0, 5760.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2d2995dd-2c9f-2b95-b9a6-656ff6f473bb', '8f240719-b0a0-48c6-c0e8-34db7fb6c37d', '102', 0.0, 2826.6667) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('7c92cbd1-3985-2d11-f579-435f89a0764a', '8f240719-b0a0-48c6-c0e8-34db7fb6c37d', '201', 0.0, 82322.1383) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('32b94b95-076a-b982-1dbe-d667cbd83b08', '2026-09-25', 'Penerimaan PO 25 September', 'JU-20260925-067') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('5c65c01e-7d00-557b-e94c-d759b859352f', '32b94b95-076a-b982-1dbe-d667cbd83b08', '401', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('c04a9f33-07fc-be86-f283-1160e3c4053e', '2026-09-25', 'Penerimaan PO 25 September (Cash)', 'JU-20260925-068') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f4e5157b-0c69-6151-d71e-70010bd468b6', 'c04a9f33-07fc-be86-f283-1160e3c4053e', '101', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('4fad2b6b-a0ec-486d-522f-125fdc4ed5b7', '2026-09-26', 'Pembelian Bahan', 'JU-20260926-069') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('79a720f1-a39f-09d6-f348-fea9d21b44b0', '4fad2b6b-a0ec-486d-522f-125fdc4ed5b7', '101', 0.0, 139005.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('c42ba700-072f-dcf4-77d9-bdfcaed7a782', '2026-09-26', 'Pembelian Botol 100 Pcs', 'JU-20260926-070') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('7139b95d-d700-fed2-6c28-94bef61ba796', 'c42ba700-072f-dcf4-77d9-bdfcaed7a782', '102', 95700.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('adbc4c04-325e-9c82-0e8b-4d20d5b2466f', 'c42ba700-072f-dcf4-77d9-bdfcaed7a782', '101', 0.0, 95700.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('40c3fdac-f268-7e54-a5ac-a6e678276b55', '2026-09-26', 'Pembelian Botol 1l', 'JU-20260926-071') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('6f41ef24-569b-6255-7ff7-08e3f02e0422', '40c3fdac-f268-7e54-a5ac-a6e678276b55', '102', 30000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d3345245-e062-ce0e-5630-0a530c3becd1', '40c3fdac-f268-7e54-a5ac-a6e678276b55', '101', 0.0, 30000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('856a51f6-bd37-1efa-4b00-a57a3ec75a27', '2026-09-26', 'Pembelian Es Batu CFD 27 September', 'JU-20260926-072') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('a91fff30-dbbf-8dd7-1b7f-f71851be7348', '856a51f6-bd37-1efa-4b00-a57a3ec75a27', '501', 10000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('81076140-db44-83c7-f957-00650213c4a7', '856a51f6-bd37-1efa-4b00-a57a3ec75a27', '101', 0.0, 10000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('27054083-8e0d-a3ca-51ba-887678d509df', '2026-09-26', 'Pembelian Krimer Krim Cafe 500g', 'JU-20260926-073') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('56544ed5-e8a0-c4a7-4822-876bd5b730eb', '27054083-8e0d-a3ca-51ba-887678d509df', '102', 62805.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('cd7e021f-ac53-ac54-0f3a-0fb0fa265de5', '2026-09-26', 'Pembelian Queen Gascart 225G', 'JU-20260926-074') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('6fb4ddcc-8e8e-f27a-0bed-46e1c8ef76be', 'cd7e021f-ac53-ac54-0f3a-0fb0fa265de5', '601', 13250.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('fbb217ff-d8f9-53f2-b807-18135b9333a4', '2026-09-26', 'Pembelian Susu UHT Grandiary 950ml', 'JU-20260926-075') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('7b98317e-7782-52d6-beb1-b5a7ba27d8ab', 'fbb217ff-d8f9-53f2-b807-18135b9333a4', '102', 62950.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('99ed2336-bee0-2ab6-298c-8d4657f6fad4', '2026-09-26', 'Pembuatan Jualan CFD 27 & PO 28 September', 'JU-20260926-076') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d078c2fa-3bf9-69d3-e94c-b78e750c6a90', '99ed2336-bee0-2ab6-298c-8d4657f6fad4', '102', 0.0, 11532.12) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('5f63d02d-c577-648d-1b54-c5e4693f9941', '99ed2336-bee0-2ab6-298c-8d4657f6fad4', '102', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('353ae463-48ac-24b4-7a10-0c70c671c0f2', '99ed2336-bee0-2ab6-298c-8d4657f6fad4', '102', 0.0, 3130.185) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('4c0f0804-a405-6475-6a5d-c5def012d279', '99ed2336-bee0-2ab6-298c-8d4657f6fad4', '102', 0.0, 7680.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0bb7fd8f-d189-3624-190c-b050c9510811', '99ed2336-bee0-2ab6-298c-8d4657f6fad4', '102', 0.0, 14312.8421) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f98234be-940b-74f6-b13f-fd63785747f9', '99ed2336-bee0-2ab6-298c-8d4657f6fad4', '201', 0.0, 87111.8529) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('8ba2e770-c933-1b36-545c-bfffa0e2cbe9', '2026-09-26', 'Pembuatan PO 25 September', 'JU-20260926-077') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('1b6d4c8c-ff09-4ad5-655b-478d251e8cdd', '8ba2e770-c933-1b36-545c-bfffa0e2cbe9', '501', 128767.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('1a8e93eb-56cb-a215-174f-a84f5417e994', '2026-09-26', 'Penerimaan CFD 27 September', 'JU-20260926-078') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('b7de3f30-91b9-cd83-9ae9-9d5511c78c1a', '1a8e93eb-56cb-a215-174f-a84f5417e994', '101', 60000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('4fcd74dc-85f1-3694-d27e-eddcf7ac2a16', '1a8e93eb-56cb-a215-174f-a84f5417e994', '401', 0.0, 60000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('e6eb5c45-df18-0712-004f-93d1da77f66b', '2026-09-26', 'Penerimaan DP 28 September', 'JU-20260926-079') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('76348d82-4cd3-b18a-0f34-858416d240c7', 'e6eb5c45-df18-0712-004f-93d1da77f66b', '101', 60000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('a2af79a4-8948-5f9d-d916-70dc8cc78cbd', 'e6eb5c45-df18-0712-004f-93d1da77f66b', '401', 0.0, 60000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('eee7439d-64e6-7b91-ec7d-e6ff12fcf136', '2026-09-26', 'Penerimaan PO 25 September', 'JU-20260926-080') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f76d6903-5c76-5a9d-1a8b-b6340cdb29a0', 'eee7439d-64e6-7b91-ec7d-e6ff12fcf136', '101', 70000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('22cbadca-4dd7-6fb4-2bf3-3c4068196e93', 'eee7439d-64e6-7b91-ec7d-e6ff12fcf136', '401', 0.0, 70000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('813d628a-91dd-d80e-c999-49df386d5fac', '2026-09-27', 'Pembelian Nescafe Biru', 'JU-20260927-081') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f93b69c0-ac62-7ede-2d34-1cb4b8656e82', '813d628a-91dd-d80e-c999-49df386d5fac', '102', 12000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('3162fb29-8a82-f38d-49f9-b134a569ff16', '813d628a-91dd-d80e-c999-49df386d5fac', '201', 0.0, 12000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('c7441c0f-7854-6522-5daa-a45c3b030d18', '2026-09-27', 'Pembuatan PO 28 September', 'JU-20260927-082') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('90bdb329-923f-384c-e3d6-afdaab2a643d', 'c7441c0f-7854-6522-5daa-a45c3b030d18', '501', 27983.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('77f64cc0-3ee1-f659-d497-ef9293550243', 'c7441c0f-7854-6522-5daa-a45c3b030d18', '102', 0.0, 3844.04) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('20a04bc0-7fbc-6ba4-8670-d781e23362f6', 'c7441c0f-7854-6522-5daa-a45c3b030d18', '102', 0.0, 2560.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f01c590e-0357-f8c7-fe7e-c548f12e1a21', 'c7441c0f-7854-6522-5daa-a45c3b030d18', '102', 0.0, 4187.8316) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('38dc288f-3e85-cf3c-af69-4cdc40a344a2', 'c7441c0f-7854-6522-5daa-a45c3b030d18', '102', 0.0, 2400.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d9739d6c-e739-0f55-f8ae-de8d27bfe29a', 'c7441c0f-7854-6522-5daa-a45c3b030d18', '102', 0.0, 297.5439) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('8626cbe4-d84a-a40a-5919-c3e683fe6f0a', 'c7441c0f-7854-6522-5daa-a45c3b030d18', '201', 0.0, 14693.5846) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('178dddba-8a1a-17dc-5bf3-d7d0103a7ac0', '2026-09-28', 'Penerimaan PO 28 September', 'JU-20260928-083') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f44f8455-c319-e926-2b25-249dd53806ee', '178dddba-8a1a-17dc-5bf3-d7d0103a7ac0', '101', 30000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('1158b4af-8ae4-cffb-8100-e30c3988f855', '178dddba-8a1a-17dc-5bf3-d7d0103a7ac0', '401', 0.0, 30000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('bcd3272a-a3e4-e33a-6118-82a0362fc77f', '178dddba-8a1a-17dc-5bf3-d7d0103a7ac0', '101', 30000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('4aa4e39f-5b3a-272e-57ba-1a856a1fefcf', '178dddba-8a1a-17dc-5bf3-d7d0103a7ac0', '401', 0.0, 30000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0f6e9a77-5c75-7c09-bdad-cefe5321f3dd', '178dddba-8a1a-17dc-5bf3-d7d0103a7ac0', '101', 20000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('a22a95ba-d9dd-b102-2185-8c6cb1e7c0f5', '178dddba-8a1a-17dc-5bf3-d7d0103a7ac0', '401', 0.0, 20000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('0f9bbcce-7179-fbd6-8405-fa8312054264', '2026-09-28', 'Penerimaan Pendapatan Bunga Bank Jago', 'JU-20260928-084') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('a756f5da-6b04-2695-9a14-1b84c5dbdfb6', '0f9bbcce-7179-fbd6-8405-fa8312054264', '101', 240.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0e9e52c2-c78d-5dc7-0c3a-0a7b32b19385', '0f9bbcce-7179-fbd6-8405-fa8312054264', '401', 0.0, 240.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('705f8ffb-189f-913c-b9fb-4e210a49ddba', '2026-09-29', 'Pembelian Es PO 30 September', 'JU-20260929-085') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0518e1a0-4d17-7acb-8524-8da0a7780321', '705f8ffb-189f-913c-b9fb-4e210a49ddba', '501', 5000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c20b54a2-af49-0639-e3b9-9158928af631', '705f8ffb-189f-913c-b9fb-4e210a49ddba', '101', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('c4c7db3e-6998-a629-a7c1-f6b7fc873051', '2026-09-29', 'Pembelian Thermal Bag PO 30 September', 'JU-20260929-086') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('1c811958-5655-f1b9-74af-6e7fb9e246cc', 'c4c7db3e-6998-a629-a7c1-f6b7fc873051', '501', 19500.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f95ec69d-e491-8dfa-244f-6641d32bdc6a', 'c4c7db3e-6998-a629-a7c1-f6b7fc873051', '101', 0.0, 19500.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('446209fc-bdc0-d92a-0ccc-a99221828e94', '2026-09-29', 'Pembuatan PO 30 September', 'JU-20260929-087') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('3485a28c-d931-e18a-47f3-d23a7da1ede0', '446209fc-bdc0-d92a-0ccc-a99221828e94', '501', 184711.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e1b23e49-336c-0a84-207f-6029a106526e', '446209fc-bdc0-d92a-0ccc-a99221828e94', '102', 0.0, 28710.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('00a4f7f1-48b0-3e27-535b-569b7955458c', '446209fc-bdc0-d92a-0ccc-a99221828e94', '102', 0.0, 19200.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('5c8313d8-ba80-3e48-f626-2b5bfd0103ea', '446209fc-bdc0-d92a-0ccc-a99221828e94', '102', 0.0, 26889.5895) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('285b22e1-abd7-0ad5-576e-819735048f18', '446209fc-bdc0-d92a-0ccc-a99221828e94', '102', 0.0, 5168.445) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('946ecdf3-c17a-aebb-ea20-f9fd1f5a0121', '446209fc-bdc0-d92a-0ccc-a99221828e94', '102', 0.0, 34793.97) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('429c224a-ac64-14ab-0b04-f147925ec25f', '446209fc-bdc0-d92a-0ccc-a99221828e94', '201', 0.0, 69948.9955) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('dca99b8a-474d-7d73-4def-12159e352f23', '2026-09-30', 'Pembelian Es PO 1 Oktober', 'JU-20260930-088') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('67062e25-227f-2b81-73eb-2936003bba77', 'dca99b8a-474d-7d73-4def-12159e352f23', '501', 5000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('84205c3b-4f81-84fb-88c4-461e9698bc54', 'dca99b8a-474d-7d73-4def-12159e352f23', '101', 0.0, 5000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('c1a283ac-0f50-d6fa-b5af-99bc8d227d79', '2026-09-30', 'Pembelian Sirup GKC 640ml', 'JU-20260930-089') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0a7fb533-7236-732c-d8e4-2811132a9230', 'c1a283ac-0f50-d6fa-b5af-99bc8d227d79', '102', 41570.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('d7009779-bf1c-57c0-46e4-b82525b2f27a', 'c1a283ac-0f50-d6fa-b5af-99bc8d227d79', '101', 0.0, 41570.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('8df2f976-8432-0b7b-327e-f8293958352c', '2026-09-30', 'Pembuatan PO 1 Oktober', 'JU-20260930-090') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2eb3fe9f-16d7-0787-de1c-4611ad577ea5', '8df2f976-8432-0b7b-327e-f8293958352c', '501', 90975.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('e346a9ae-a04a-364f-6bdd-10a9526bdeb0', '8df2f976-8432-0b7b-327e-f8293958352c', '102', 0.0, 13398.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('7d706c03-3a25-da4a-7170-1800c63746a3', '8df2f976-8432-0b7b-327e-f8293958352c', '102', 0.0, 8960.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('5596c606-d265-60ba-39be-8eef46b4f0ae', '8df2f976-8432-0b7b-327e-f8293958352c', '102', 0.0, 13159.8632) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ac485123-672c-10a9-cea2-9a5c9a7481c9', '8df2f976-8432-0b7b-327e-f8293958352c', '102', 0.0, 1019.13) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('1ffdd707-317c-442c-1fff-e837f4e3d429', '8df2f976-8432-0b7b-327e-f8293958352c', '102', 0.0, 18339.06) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2e456f59-680f-dab8-cf2f-194e12895d23', '8df2f976-8432-0b7b-327e-f8293958352c', '102', 0.0, 2400.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('73dfe8aa-5109-d43b-a1a0-ba178bb53991', '8df2f976-8432-0b7b-327e-f8293958352c', '102', 0.0, 1227.3684) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('a1fea390-2091-3c0c-7bb5-6f69e0399373', '8df2f976-8432-0b7b-327e-f8293958352c', '201', 0.0, 32471.5784) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('d7ba73c8-9285-402c-aecb-4615243a3c2c', '2026-09-30', 'Penerimaan Pelunasan Kak Okta 30 September', 'JU-20260930-091') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('f43732f1-9cbc-d3c7-8e47-e7237a3f81c4', 'd7ba73c8-9285-402c-aecb-4615243a3c2c', '101', 179550.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('aeb0a394-9542-9201-1c3c-a836b2429afe', 'd7ba73c8-9285-402c-aecb-4615243a3c2c', '401', 0.0, 179550.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('6b690266-66f2-9b32-371e-4ed0112f6e42', '2026-09-30', 'Penyesuaian Stiker', 'JU-20260930-092') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('813a222d-5c14-3088-d1fb-6a46d5e9946a', '6b690266-66f2-9b32-371e-4ed0112f6e42', '102', 16000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0deb6c21-13f4-430d-78ab-ceaf3e330763', '6b690266-66f2-9b32-371e-4ed0112f6e42', '601', 0.0, 16000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('367719ed-eb8a-17e9-5abd-e9788d02753a', '2026-10-10', 'Pembelian Bahan Hari-hari', 'JU-20261010-093') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ddc69e93-e295-81a5-d0a1-be5fb91193a5', '367719ed-eb8a-17e9-5abd-e9788d02753a', '102', 32760.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('254fb782-7598-c10a-ce01-314700440450', '367719ed-eb8a-17e9-5abd-e9788d02753a', '102', 50000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('9428726a-7d24-8114-10f8-dff69ffc5b10', '367719ed-eb8a-17e9-5abd-e9788d02753a', '102', 17800.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('84b55f7b-e17f-d03f-33aa-b5b801bd4278', '367719ed-eb8a-17e9-5abd-e9788d02753a', '103', 53390.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ce185580-20c7-b839-96f8-ea9c598e082f', '367719ed-eb8a-17e9-5abd-e9788d02753a', '101', 0.0, 153950.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('e056abdf-15d1-4284-d5f8-cd11bc64b7c5', '2026-10-10', 'Pembelian Es Batu Warung Madura', 'JU-20261010-094') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('c7ce1c7c-9c61-e7e1-6eb4-fb3d07c44316', 'e056abdf-15d1-4284-d5f8-cd11bc64b7c5', '501', 4500.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('540754ac-963d-ffc4-c9b5-eb48600f0126', 'e056abdf-15d1-4284-d5f8-cd11bc64b7c5', '101', 0.0, 4500.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('f932ec5b-cd06-d5dd-e05c-92b1ce22e804', '2026-10-10', 'Pembuatan PO CFD 11 Oktober', 'JU-20261010-095') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('10b47d2e-ca43-ac67-8a3a-d388fc6318b4', 'f932ec5b-cd06-d5dd-e05c-92b1ce22e804', '501', 97143.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('67e86da9-9d0a-011f-271c-5132838e6cfd', 'f932ec5b-cd06-d5dd-e05c-92b1ce22e804', '102', 0.0, 11484.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('8d7fedab-ad4b-e67c-b545-3088a952c40b', 'f932ec5b-cd06-d5dd-e05c-92b1ce22e804', '102', 0.0, 1038.25) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('10b61fcf-3036-5c16-4dde-43d2dc50bcff', 'f932ec5b-cd06-d5dd-e05c-92b1ce22e804', '102', 0.0, 10505.0625) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('8dbcfd2a-0b6d-9971-ac0a-0e2b0decb8ba', 'f932ec5b-cd06-d5dd-e05c-92b1ce22e804', '102', 0.0, 18161.37) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('0fa16a3e-58f9-4e60-5c2f-d4188adade9e', 'f932ec5b-cd06-d5dd-e05c-92b1ce22e804', '102', 0.0, 9369.36) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('2d42de66-51cf-83c4-6d33-ce61c751fe3f', 'f932ec5b-cd06-d5dd-e05c-92b1ce22e804', '102', 0.0, 2338.3125) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('14043b43-1c65-762d-c3ef-349e202588ee', 'f932ec5b-cd06-d5dd-e05c-92b1ce22e804', '102', 0.0, 632.2807) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('ef9ee0d6-9ac8-5253-844c-0f531e92e10c', 'f932ec5b-cd06-d5dd-e05c-92b1ce22e804', '102', 0.0, 2966.6667) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('23e7d121-9feb-6975-1257-1b589cc05ad3', 'f932ec5b-cd06-d5dd-e05c-92b1ce22e804', '201', 0.0, 40647.6976) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('5c71fe00-8882-8d8b-e855-49afc514369c', '2026-11-10', 'Pembelian Botol 250ml 100 Pcs', 'JU-20261110-096') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('6093a4da-d1e8-0de6-d105-218609343eca', '5c71fe00-8882-8d8b-e855-49afc514369c', '102', 95713.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('7f21b3ef-b246-cdd1-72a6-2f89fa360452', '5c71fe00-8882-8d8b-e855-49afc514369c', '101', 0.0, 95713.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('b2b5c109-398d-2985-af9f-eba8b5d61c11', '2026-11-10', 'Penerimaan PO CFD 11 Oktober', 'JU-20261110-097') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('3e3e7a0c-b3a1-d2aa-6582-acd1f25c6e81', 'b2b5c109-398d-2985-af9f-eba8b5d61c11', '101', 104000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('7bd4ed02-c9f5-e32f-f3ba-cfc4cacc33e0', 'b2b5c109-398d-2985-af9f-eba8b5d61c11', '401', 0.0, 104000.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('34da0cfe-8da8-bdc9-8363-f5c4e67465d2', '2926-11-10', 'CFD', 'JU-29261110-098') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('3ed99af9-a608-3f36-f4dd-cedb782f4dbb', '34da0cfe-8da8-bdc9-8363-f5c4e67465d2', '101', 20000.0, 0.0) ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_entries (id, entry_date, description, reference_number) VALUES ('054408d8-b6fa-8117-3fb6-cb90623794eb', '2926-11-11', 'CFD', 'JU-29261111-099') ON CONFLICT (id) DO NOTHING;
INSERT INTO journal_items (id, journal_entry_id, account_code, debit, credit) VALUES ('1cc498b0-cb94-8f8d-f1b1-bd592d88a468', '054408d8-b6fa-8117-3fb6-cb90623794eb', '401', 0.0, 20000.0) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 10. SEED: OPEX EXPENSES (Biaya Lain-lain from Excel)
-- =============================================================================
INSERT INTO opex_expenses (id, expense_date, category, description, amount, payment_account_code) VALUES ('bd5e57ac-d548-17bc-fb57-887d53cff0a1', '2026-09-13', 'Modal Awal', 'Penyetoran Modal Awal (Biaya Lain-lain)', 302090.0, '101') ON CONFLICT (id) DO NOTHING;
INSERT INTO opex_expenses (id, expense_date, category, description, amount, payment_account_code) VALUES ('e103bc3d-612e-7291-c109-8d35b6ffddcc', '2026-09-19', 'Operasional Toko', 'Pembelian Susu Nobo 200ml 2 pcs', 5000.0, '101') ON CONFLICT (id) DO NOTHING;
INSERT INTO opex_expenses (id, expense_date, category, description, amount, payment_account_code) VALUES ('0b9f12c7-067b-38e3-aaab-45d4a9ae7228', '2026-09-25', 'Operasional Toko', 'Pembelian Makanan/Minuman', 4000.0, '101') ON CONFLICT (id) DO NOTHING;
INSERT INTO opex_expenses (id, expense_date, category, description, amount, payment_account_code) VALUES ('8affe41f-4a52-3225-dd12-64ed932dbd9f', '2026-09-26', 'Operasional Toko', 'Pembelian Queen Gascart 225G', 13250.0, '101') ON CONFLICT (id) DO NOTHING;
INSERT INTO opex_expenses (id, expense_date, category, description, amount, payment_account_code) VALUES ('a546f297-b002-f452-2080-6cd22f587018', '2026-10-05', 'Kemasan / Packaging', 'Pembelian Tooth Bag', 4200.0, '101') ON CONFLICT (id) DO NOTHING;
INSERT INTO opex_expenses (id, expense_date, category, description, amount, payment_account_code) VALUES ('c520d896-585c-49db-1924-dc556868493c', '2026-10-08', 'Kemasan / Packaging', 'Pembelian Thermal Bag 6 Pcs', 46500.0, '101') ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 11. ROW LEVEL SECURITY (RLS) CONFIGURATION
-- =============================================================================
ALTER TABLE chart_of_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE bom_recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE opex_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 12. VIEWS (Financial Summary, Safety Stock, Balance Sheet)
-- =============================================================================
CREATE OR REPLACE VIEW v_inventory_safety_stock AS
SELECT 
    id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days,
    ROUND((max_daily_usage * max_lead_time_days) - (avg_daily_usage * avg_lead_time_days), 2) AS safety_stock,
    ROUND(((avg_daily_usage * avg_lead_time_days) + ((max_daily_usage * max_lead_time_days) - (avg_daily_usage * avg_lead_time_days))), 2) AS reorder_point,
    CASE 
        WHEN current_stock <= ((max_daily_usage * max_lead_time_days) - (avg_daily_usage * avg_lead_time_days)) THEN 'CRITICAL'
        WHEN current_stock <= ((avg_daily_usage * avg_lead_time_days) + ((max_daily_usage * max_lead_time_days) - (avg_daily_usage * avg_lead_time_days))) THEN 'REORDER'
        ELSE 'SAFE'
    END AS stock_status
FROM raw_materials;
CREATE OR REPLACE VIEW v_financial_summary AS
WITH journal_summary AS (
    SELECT 
        COALESCE(SUM(CASE WHEN account_code = '401' THEN credit - debit ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN account_code = '501' THEN debit - credit ELSE 0 END), 0) AS total_hpp,
        COALESCE(SUM(CASE WHEN account_code = '601' THEN debit - credit ELSE 0 END), 0) AS total_opex
    FROM journal_items
),
orders_summary AS (
    SELECT 
        COALESCE(SUM(total_amount), 0) AS ord_revenue,
        COALESCE(SUM(total_hpp), 0) AS ord_hpp
    FROM orders WHERE status = 'COMPLETED'
)
SELECT 
    CASE WHEN j.total_revenue > 0 THEN j.total_revenue ELSE o.ord_revenue END AS total_revenue,
    CASE WHEN j.total_hpp > 0 THEN j.total_hpp ELSE o.ord_hpp END AS total_hpp,
    (CASE WHEN j.total_revenue > 0 THEN j.total_revenue ELSE o.ord_revenue END - CASE WHEN j.total_hpp > 0 THEN j.total_hpp ELSE o.ord_hpp END) AS gross_profit,
    j.total_opex,
    (CASE WHEN j.total_revenue > 0 THEN j.total_revenue ELSE o.ord_revenue END - CASE WHEN j.total_hpp > 0 THEN j.total_hpp ELSE o.ord_hpp END - j.total_opex) AS net_profit
FROM journal_summary j, orders_summary o;
CREATE OR REPLACE VIEW v_balance_sheet AS
WITH accounts AS (
    SELECT 
        account_code,
        SUM(debit - credit) as net_debit
    FROM journal_items
    GROUP BY account_code
)
SELECT
    COALESCE(SUM(CASE WHEN account_code = '101' THEN net_debit ELSE 0 END), 0) AS kas,
    COALESCE(SUM(CASE WHEN account_code = '102' THEN net_debit ELSE 0 END), 0) AS persediaan,
    COALESCE(SUM(CASE WHEN account_code = '103' THEN net_debit ELSE 0 END), 0) AS aset,
    COALESCE(SUM(CASE WHEN account_code IN ('101', '102', '103') THEN net_debit ELSE 0 END), 0) AS total_aktiva,
    COALESCE(SUM(CASE WHEN account_code IN ('201', '202') THEN -net_debit ELSE 0 END), 0) AS hutang_dagang,
    COALESCE(SUM(CASE WHEN account_code = '301' THEN -net_debit ELSE 0 END), 0) AS modal,
    (
        COALESCE(SUM(CASE WHEN account_code = '401' THEN -net_debit ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN account_code IN ('501', '601') THEN net_debit ELSE 0 END), 0)
    ) AS laba_rugi_bersih,
    (
        COALESCE(SUM(CASE WHEN account_code IN ('201', '202') THEN -net_debit ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN account_code = '301' THEN -net_debit ELSE 0 END), 0)
        + (
            COALESCE(SUM(CASE WHEN account_code = '401' THEN -net_debit ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN account_code IN ('501', '601') THEN net_debit ELSE 0 END), 0)
        )
    ) AS total_passiva
FROM accounts;

COMMIT;

-- Selesai! Semua data dari Kopi Sesuk ERP (2).xlsx sudah diinjeksi.