-- =============================================================================
-- KOPI SESUK CENTRALIZED ERP - SUPABASE POSTGRESQL DDL & INITIAL SEED DATA
-- Document ID: FSD-KS-2026-V1
-- Target Database: Supabase / PostgreSQL 14+
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES (idempotent - safe to re-run)
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin', 'store_admin', 'kasir', 'finance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_segment AS ENUM ('BNPP', 'BAF', 'CFD', 'POS', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('DP', 'LUNAS', 'BELUM_BAYAR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('CASH', 'QRIS', 'TRANSFER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. CHART OF ACCOUNTS (COA) TABLE
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type account_type NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RAW MATERIALS (BAHAN BAKU & INVENTARIS TERPUSAT) TABLE
CREATE TABLE IF NOT EXISTS raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    base_unit VARCHAR(20) NOT NULL, -- ml, gram, pcs
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Rp per ml/gram/pcs
    avg_daily_usage NUMERIC(12, 2) DEFAULT 0,
    max_daily_usage NUMERIC(12, 2) DEFAULT 0,
    avg_lead_time_days NUMERIC(5, 2) DEFAULT 1,
    max_lead_time_days NUMERIC(5, 2) DEFAULT 2,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTS & VARIANTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) DEFAULT 'Kopi',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size_label VARCHAR(50) NOT NULL, -- 250ml, 1 Liter
    size_ml INT NOT NULL, -- 250 or 1000
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BILL OF MATERIALS (BOM RECIPES) TABLE
CREATE TABLE IF NOT EXISTS bom_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    raw_material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
    qty_required NUMERIC(12, 2) NOT NULL, -- takaran per unit porsi/botol
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(variant_id, raw_material_id)
);

-- 7. ORDERS & ORDER ITEMS TABLE
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
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    sugar_level VARCHAR(30) DEFAULT 'Normal', -- Normal, Less Sugar, No Sugar
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    unit_hpp NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12, 2) NOT NULL,
    subtotal_hpp NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- 8. INVENTORY TRANSACTIONS LOG TABLE
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_material_id UUID REFERENCES raw_materials(id),
    transaction_type VARCHAR(20) NOT NULL, -- IN (Penerimaan), OUT (Deduksi BOM), ADJUSTMENT
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reference_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DOUBLE-ENTRY JOURNAL TABLES
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    reference_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(10) REFERENCES chart_of_accounts(code),
    debit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- 10. OPERATIONAL EXPENSES (OPEX) TABLE
CREATE TABLE IF NOT EXISTS opex_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_account_code VARCHAR(10) REFERENCES chart_of_accounts(code) DEFAULT '101',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUDIT TRAIL & SYSTEM ACTIVITY LOG TABLE (IMMUTABLE LEDGER)
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);


-- =============================================================================
-- VIEWS: SAFETY STOCK (SS), REORDER POINT (ROP), BEP & FINANCIAL ANALYSIS
-- =============================================================================

-- View 1: Inventory Safety Stock & Reorder Point Status
CREATE OR REPLACE VIEW v_inventory_safety_stock AS
SELECT 
    id,
    name,
    base_unit,
    current_stock,
    unit_price,
    avg_daily_usage,
    max_daily_usage,
    avg_lead_time_days,
    max_lead_time_days,
    ROUND((max_daily_usage * max_lead_time_days) - (avg_daily_usage * avg_lead_time_days), 2) AS safety_stock,
    ROUND(((avg_daily_usage * avg_lead_time_days) + ((max_daily_usage * max_lead_time_days) - (avg_daily_usage * avg_lead_time_days))), 2) AS reorder_point,
    CASE 
        WHEN current_stock <= ((max_daily_usage * max_lead_time_days) - (avg_daily_usage * avg_lead_time_days)) THEN 'CRITICAL'
        WHEN current_stock <= ((avg_daily_usage * avg_lead_time_days) + ((max_daily_usage * max_lead_time_days) - (avg_daily_usage * avg_lead_time_days))) THEN 'REORDER'
        ELSE 'SAFE'
    END AS stock_status
FROM raw_materials;

-- View 2: Real-time Financial Summary & Profit Loss
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
    COALESCE(SUM(CASE WHEN account_code IN ('201', '202', '203') THEN -net_debit ELSE 0 END), 0) AS hutang_dagang,
    COALESCE(SUM(CASE WHEN account_code = '301' THEN -net_debit ELSE 0 END), 0) AS modal,
    (
        COALESCE(SUM(CASE WHEN account_code = '401' THEN -net_debit ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN account_code IN ('501', '601') THEN net_debit ELSE 0 END), 0)
    ) AS laba_rugi_bersih,
    (
        COALESCE(SUM(CASE WHEN account_code IN ('201', '202', '203') THEN -net_debit ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN account_code = '301' THEN -net_debit ELSE 0 END), 0)
        + (
            COALESCE(SUM(CASE WHEN account_code = '401' THEN -net_debit ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN account_code IN ('501', '601') THEN net_debit ELSE 0 END), 0)
        )
    ) AS total_passiva
FROM accounts;


-- =============================================================================
-- AUTOMATED TRIGGERS: DYNAMIC BOM DEDUCTION & AUTO-JOURNALING
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_process_completed_order()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    bom RECORD;
    v_journal_id UUID;
BEGIN
    -- Only trigger when order status changes to COMPLETED
    IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status <> 'COMPLETED') THEN

        -- 1. Deduct Inventory based on BOM
        FOR item IN SELECT * FROM order_items WHERE order_id = NEW.id LOOP
            FOR bom IN SELECT * FROM bom_recipes WHERE variant_id = item.variant_id LOOP
                -- Deduct stock
                UPDATE raw_materials 
                SET current_stock = current_stock - (bom.qty_required * item.quantity),
                    updated_at = NOW()
                WHERE id = bom.raw_material_id;

                -- Record inventory transaction out log
                INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, reference_order_id, notes)
                VALUES (bom.raw_material_id, 'OUT', (bom.qty_required * item.quantity), NEW.id, 'Deduksi Otomatis Order ' || NEW.order_number);
            END LOOP;
        END LOOP;

        -- 2. Auto-Posting Double Entry Journal
        -- Header
        INSERT INTO journal_entries (entry_date, description, reference_number)
        VALUES (NEW.delivery_date, 'Penjualan Otomatis Order ' || NEW.order_number || ' (' || NEW.customer_name || ')', NEW.order_number)
        RETURNING id INTO v_journal_id;

        -- Line 1: Debet Kas / Bank (101)
        INSERT INTO journal_items (journal_entry_id, account_code, debit, credit)
        VALUES (v_journal_id, '101', NEW.total_amount, 0);

        -- Line 2: Kredit Pendapatan Sales (401)
        INSERT INTO journal_items (journal_entry_id, account_code, debit, credit)
        VALUES (v_journal_id, '401', 0, NEW.total_amount);

        -- Line 3: Debet BPP / HPP Kopi (501)
        INSERT INTO journal_items (journal_entry_id, account_code, debit, credit)
        VALUES (v_journal_id, '501', NEW.total_hpp, 0);

        -- Line 4: Kredit Persediaan Bahan (102)
        INSERT INTO journal_items (journal_entry_id, account_code, debit, credit)
        VALUES (v_journal_id, '102', 0, NEW.total_hpp);

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_completed_order ON orders;
CREATE TRIGGER trg_completed_order
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_process_completed_order();


-- =============================================================================
-- INITIAL SEED DATA (BASED ON FSD SPECIFICATIONS)
-- =============================================================================

-- Seed COA
INSERT INTO chart_of_accounts (code, name, type, description) VALUES
('101', 'Kas / Bank', 'ASSET', 'Pencatatan kas masuk hasil penjualan dan pengeluaran tunai'),
('102', 'Persediaan Bahan', 'ASSET', 'Aset persediaan bahan baku terpusat toko'),
('201', 'Hutang Supplier', 'LIABILITY', 'Kewajiban pembayaran pembelian kredit vendor'),
('301', 'Modal Toko', 'EQUITY', 'Modal terpusat pemilik toko'),
('401', 'Pendapatan Sales', 'REVENUE', 'Pendapatan hasil penjualan kopi PO & CFD'),
('501', 'BPP (HPP Kopi)', 'EXPENSE', 'Harga Pokok Penjualan berbasis deduksi resep BOM'),
('601', 'Beban Operasional', 'EXPENSE', 'Biaya operasional sewa, listrik, pemasaran, packaging')
ON CONFLICT (code) DO NOTHING;

-- Seed Raw Materials (FSD Section 4.1)
INSERT INTO raw_materials (id, name, base_unit, current_stock, unit_price, avg_daily_usage, max_daily_usage, avg_lead_time_days, max_lead_time_days) VALUES
('11111111-1111-1111-1111-111111111111', 'Susu UHT', 'ml', 15000, 20.00, 1200, 2000, 2, 4),
('22222222-2222-2222-2222-222222222222', 'Krimer / Whip Cream', 'gram', 3500, 72.00, 200, 450, 2, 4),
('33333333-3333-3333-3333-333333333333', 'Sirup GKC / DriPP / CGK', 'ml', 4000, 65.00, 250, 500, 3, 5),
('44444444-4444-4444-4444-444444444444', 'Nescafe Biru / Kapal Api', 'gram', 2000, 139.00, 120, 250, 2, 4),
('55555555-5555-5555-5555-555555555555', 'Gula Aren Liquid', 'ml', 3000, 38.00, 200, 400, 2, 4),
('66666666-6666-6666-6666-666666666666', 'Cup / Botol 1L + Stiker', 'pcs', 300, 961.00, 25, 60, 2, 4)
ON CONFLICT (id) DO NOTHING;

-- Seed Products & Variants (FSD Section 3.2 & 4.1)
-- Products
INSERT INTO products (id, name, code) VALUES
('a1111111-1111-1111-1111-111111111111', 'Buttersesuk', 'PROD-BTS'),
('a2222222-2222-2222-2222-222222222222', 'Kopi Susu Aren', 'PROD-KSA'),
('a3333333-3333-3333-3333-333333333333', 'Americano', 'PROD-AMC'),
('a4444444-4444-4444-4444-444444444444', 'Coklat Sesuk', 'PROD-CKS')
ON CONFLICT (id) DO NOTHING;

-- Product Variants (250ml & 1 Liter)
INSERT INTO product_variants (id, product_id, size_label, size_ml, selling_price) VALUES
-- Buttersesuk
('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '250 ml (Cup)', 250, 10000),
('b1111111-1111-1111-1111-222222222222', 'a1111111-1111-1111-1111-111111111111', '1 Liter (Botol)', 1000, 60000),

-- Kopi Susu Aren
('b2222222-2222-2222-2222-111111111111', 'a2222222-2222-2222-2222-222222222222', '250 ml (Cup)', 250, 10000),
('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '1 Liter (Botol)', 1000, 60000),

-- Americano
('b3333333-3333-3333-3333-111111111111', 'a3333333-3333-3333-3333-333333333333', '250 ml (Cup)', 250, 7000),
('b3333333-3333-3333-3333-222222222222', 'a3333333-3333-3333-3333-333333333333', '1 Liter (Botol)', 1000, 60000),

-- Coklat Sesuk
('b4444444-4444-4444-4444-111111111111', 'a4444444-4444-4444-4444-444444444444', '250 ml (Cup)', 250, 10000),
('b4444444-4444-4444-4444-222222222222', 'a4444444-4444-4444-4444-444444444444', '1 Liter (Botol)', 1000, 60000)
ON CONFLICT (id) DO NOTHING;

-- Seed BOM Recipes (Per portion unit)
-- Calculated from Batch 14 porsi @250ml & Botol 1L:
-- Susu UHT: 1200ml / 14 = 85.71ml per 250ml, 800ml per 1L
-- Krimer: 150g / 14 = 10.71g per 250ml, 100g per 1L
-- Sirup GKC: 200ml / 14 = 14.28ml per 250ml, 150ml per 1L
-- Nescafe: 80g / 14 = 5.71g per 250ml, 60g per 1L
-- Gula Aren: 180ml / 14 = 12.85ml per 250ml, 120ml per 1L
-- Cup/Botol: 1 pcs

INSERT INTO bom_recipes (variant_id, raw_material_id, qty_required) VALUES
-- Kopi Susu Aren 250ml
('b2222222-2222-2222-2222-111111111111', '11111111-1111-1111-1111-111111111111', 85.71),
('b2222222-2222-2222-2222-111111111111', '22222222-2222-2222-2222-222222222222', 10.71),
('b2222222-2222-2222-2222-111111111111', '44444444-4444-4444-4444-444444444444', 5.71),
('b2222222-2222-2222-2222-111111111111', '55555555-5555-5555-5555-555555555555', 12.85),
('b2222222-2222-2222-2222-111111111111', '66666666-6666-6666-6666-666666666666', 1.00),

-- Kopi Susu Aren 1 Liter
('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 800.00),
('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 100.00),
('b2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 60.00),
('b2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 120.00),
('b2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 1.00),

-- Buttersesuk 250ml
('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 85.71),
('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 10.71),
('b1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 14.28),
('b1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 5.71),
('b1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 1.00)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 12. ROW LEVEL SECURITY (RLS) CONFIGURATION
-- Nonaktifkan RLS agar browser client (publishable key) bebas baca-tulis
-- =============================================================================
ALTER TABLE chart_of_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE bom_recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE opex_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
