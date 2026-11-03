import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

export const ResetConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '440px', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1.5px solid #FEE2E2',
          background: '#FEF2F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '0.75rem',
              background: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}>
              <AlertTriangle style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 900, color: '#991B1B', fontSize: '1rem', margin: 0 }}>
                Reset Database Sistem
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#B91C1C', margin: '0.15rem 0 0 0', fontWeight: 600 }}>
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '0.5rem',
              background: '#FFFFFF',
              border: '1px solid #FECACA',
              color: '#991B1B',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
            <strong>Semua data</strong> akan dihapus permanen dari database Supabase. Database akan menjadi pure kosong.
          </p>

          <div style={{
            padding: '0.875rem 1rem',
            background: '#FEF2F2',
            border: '1.5px solid #FECACA',
            borderRadius: '0.75rem',
            fontSize: '0.8125rem',
            color: '#7F1D1D',
            lineHeight: 1.6
          }}>
            <strong style={{ color: '#991B1B', display: 'block', marginBottom: '0.4rem' }}>🗑️ Semua tabel akan di-DELETE:</strong>
            <ul style={{ margin: '0 0 0 1rem', padding: 0 }}>
              <li>orders & order_items</li>
              <li>journal_entries & journal_items</li>
              <li>opex_expenses & inventory_transactions</li>
              <li>bom_recipes</li>
              <li>product_variants & products</li>
              <li>raw_materials (bahan baku)</li>
              <li>audit_logs</li>
            </ul>
          </div>

          <div style={{
            padding: '0.75rem 1rem',
            background: '#FFFBEB',
            border: '1.5px solid #FCD34D',
            borderRadius: '0.75rem',
            fontSize: '0.8125rem',
            color: '#78350F',
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#92400E', display: 'block', marginBottom: '0.25rem' }}>⚠️ Tidak terpengaruh:</strong>
            Chart of Accounts (COA) — data akuntansi tetap tersimpan.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1.5px solid #F1F5F9',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '0.625rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              color: '#475569',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.15rem',
              borderRadius: '0.625rem',
              fontSize: '0.8125rem',
              fontWeight: 800,
              background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #DC2626, #B91C1C)',
              border: 'none',
              color: '#FFFFFF',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(220, 38, 38, 0.35)',
              transition: 'all 0.15s'
            }}
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            {loading ? 'Menghapus...' : 'Ya, Hapus Semua Data'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
