import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

export const ResetConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

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
                Tindakan ini memerlukan konfirmasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '0.5rem',
              background: '#FFFFFF',
              border: '1px solid #FECACA',
              color: '#991B1B',
              cursor: 'pointer',
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
            Apakah Anda yakin ingin mengembalikan seluruh data ERP ke kondisi awal?
          </p>

          <div style={{
            padding: '0.875rem 1rem',
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: '0.75rem',
            fontSize: '0.8125rem',
            color: '#64748B',
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#0F172A', display: 'block', marginBottom: '0.25rem' }}>Data yang akan di-reset:</strong>
            Persediaan stok bahan baku, riwayat order PO & POS, jurnal akuntansi, dan pengeluaran beban operasional (OPEX).
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
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '0.625rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            Batal
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.15rem',
              borderRadius: '0.625rem',
              fontSize: '0.8125rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
            }}
          >
            <RefreshCw style={{ width: '14px', height: '14px' }} />
            Ya, Reset Seluruh Data
          </button>
        </div>
      </div>
    </div>
  );
};
