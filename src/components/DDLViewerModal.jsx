import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  Download,
  X,
  Code,
  Layers,
  Sparkles,
  Server
} from 'lucide-react';

export const DDLViewerModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('full');

  if (!isOpen) return null;

  const ddlScript = `-- =============================================================================
-- KOPI SESUK CENTRALIZED ERP - SUPABASE POSTGRESQL DDL & INITIAL SEED DATA
-- Document ID: FSD-KS-2026-V1
-- Target Database: Supabase / PostgreSQL 14+
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
CREATE TYPE user_role AS ENUM ('super_admin', 'store_admin', 'kasir', 'finance');
CREATE TYPE order_segment AS ENUM ('BNPP', 'BAF', 'CFD', 'POS', 'OTHER');
CREATE TYPE order_status AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('DP', 'LUNAS', 'BELUM_BAYAR');
CREATE TYPE payment_method AS ENUM ('CASH', 'QRIS', 'TRANSFER');
CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

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
    sugar_level VARCHAR(30) DEFAULT 'Normal',
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
    transaction_type VARCHAR(20) NOT NULL, -- IN, OUT, ADJUSTMENT
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

-- 11. AUDIT TRAIL & SYSTEM ACTIVITY LOG TABLE
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
-- VIEWS: SAFETY STOCK (SS), REORDER POINT (ROP) & FINANCIAL SUMMARY
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
    IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status <> 'COMPLETED') THEN
        -- 1. Deduct Inventory based on BOM
        FOR item IN SELECT * FROM order_items WHERE order_id = NEW.id LOOP
            FOR bom IN SELECT * FROM bom_recipes WHERE variant_id = item.variant_id LOOP
                UPDATE raw_materials 
                SET current_stock = current_stock - (bom.qty_required * item.quantity), updated_at = NOW()
                WHERE id = bom.raw_material_id;
            END LOOP;
        END LOOP;

        -- 2. Auto-Posting Double Entry Journal
        INSERT INTO journal_entries (entry_date, description, reference_number)
        VALUES (NEW.delivery_date, 'Penjualan Otomatis Order ' || NEW.order_number, NEW.order_number)
        RETURNING id INTO v_journal_id;

        INSERT INTO journal_items (journal_entry_id, account_code, debit, credit)
        VALUES (v_journal_id, '101', NEW.total_amount, 0);

        INSERT INTO journal_items (journal_entry_id, account_code, debit, credit)
        VALUES (v_journal_id, '401', 0, NEW.total_amount);

        INSERT INTO journal_items (journal_entry_id, account_code, debit, credit)
        VALUES (v_journal_id, '501', NEW.total_hpp, 0);

        INSERT INTO journal_items (journal_entry_id, account_code, debit, credit)
        VALUES (v_journal_id, '102', 0, NEW.total_hpp);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_completed_order
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_process_completed_order();
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(ddlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const blob = new Blob([ddlScript], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'schema.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '880px' }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1.5px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC',
          borderRadius: '1.5rem 1.5rem 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px', height: '38px',
              borderRadius: '0.625rem',
              background: '#F5F3FF',
              border: '1.5px solid #DDD6FE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#7C3AED'
            }}>
              <Database style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: '1rem', lineHeight: 1.2 }}>
                Supabase PostgreSQL DDL & Schema
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.125rem' }}>
                Script SQL Komplit Siap Import ke Supabase SQL Editor
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleCopy}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.45rem 0.875rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem', fontWeight: 700,
                background: '#FFFFFF',
                color: '#334155',
                border: '1.5px solid #CBD5E1',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F0F9FF'; e.currentTarget.style.borderColor = '#7DD3FC'; e.currentTarget.style.color = '#0284C7'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#334155'; }}
            >
              {copied ? <Check style={{ width: '14px', height: '14px', color: '#16A34A' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
              <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
            </button>
            <button
              onClick={handleDownload}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.45rem 0.95rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(2,132,199,0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <Download style={{ width: '14px', height: '14px' }} />
              <span>Unduh schema.sql</span>
            </button>
            <button
              onClick={onClose}
              style={{
                width: '32px', height: '32px',
                borderRadius: '0.5rem',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748B',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            padding: '0.875rem 1rem',
            background: '#EFF6FF',
            border: '1.5px solid #BFDBFE',
            borderRadius: '0.75rem',
            fontSize: '0.75rem',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <Server style={{ width: '18px', height: '18px', color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#1D4ED8', fontSize: '0.8rem' }}>
                Panduan Import Ke Supabase Database:
              </strong>
              1. Buka Supabase Dashboard project Anda &gt; <strong>SQL Editor</strong>.<br />
              2. Paste (Tempel) script SQL di bawah ini atau buka file <code style={{ color: '#0369A1', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>schema.sql</code> yang telah dibuat di folder project.<br />
              3. Klik <strong>RUN</strong>. Seluruh tabel, view ROP/SS, trigger pemotongan stok otomatis, & auto-journaling akan terbentuk!
            </div>
          </div>

          {/* SQL Editor Window */}
          <div style={{
            borderRadius: '0.75rem',
            border: '1px solid #CBD5E1',
            background: '#0F172A',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '0.5rem 1rem',
              background: '#1E293B',
              borderBottom: '1px solid #334155',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>schema.sql (PostgreSQL DDL)</span>
              <span>185 Baris SQL</span>
            </div>
            <pre style={{
              padding: '1rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: '#34D399',
              overflowX: 'auto',
              maxHeight: '400px',
              lineHeight: 1.6,
              margin: 0
            }}>
              {ddlScript}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
