import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  UserCheck,
  PlusCircle,
  Database,
  RefreshCw,
  TrendingUp,
  Package,
  Menu,
  LogOut,
} from 'lucide-react';
import { ResetConfirmModal } from './ResetConfirmModal';

export const Navbar = ({ onToggleMobileSidebar, onOpenNewOrder, onOpenStockIn, onOpenOpex, onOpenDDL, currentUser, onLogout }) => {
  const { activeTab, resetData } = useERP();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const activeTabTitles = {
    dashboard: 'Dashboard Overview & Performance',
    pos: 'POS Sales & Cashier Workstation',
    orders: 'PO Schedule & Sales Management',
    inventory: 'Centralized Stock & Safety Stock Control',
    bom: 'Bill of Materials (BOM) & Recipe Matrix',
    journal: 'Double-Entry Accounting & General Ledger',
    reports: 'Real-Time Financial Reports & BEP Analysis',
    audit: 'Audit Trail & System Activity Log',
    ddl: 'Supabase PostgreSQL DDL Script Viewer'
  };

  const navBtnBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.45rem 0.9rem',
    borderRadius: '0.625rem',
    fontSize: '0.8rem',
    fontWeight: 700,
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  return (
    <header style={{
      height: '64px',
      minHeight: '64px',
      background: '#fff',
      borderBottom: '1.5px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div className="navbar-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        padding: '0 2.5rem',
        userSelect: 'none',
        gap: '0.75rem',
      }}>
        {/* Page Title & Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flexShrink: 1 }}>
          <button
            onClick={onToggleMobileSidebar}
            className="mobile-hamburger-btn"
            title="Buka Menu Navigasi"
          >
            <Menu style={{ width: '18px', height: '18px' }} />
          </button>
          <div style={{ width: '8px', height: '8px', borderRadius: '9999px', background: '#0284C7', flexShrink: 0 }} />
          <h2 className="navbar-title" style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A', letterSpacing: '-0.01em', margin: 0 }}>
            {activeTabTitles[activeTab] || 'Centralized ERP System'}
          </h2>
        </div>

        {/* Actions Scrollable */}
        <div className="navbar-actions-scroll" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>

          {/* Order Baru */}
          <button
            onClick={onOpenNewOrder}
            style={{
              ...navBtnBase,
              background: 'linear-gradient(135deg, #0284C7, #0369A1)',
              color: '#fff',
              borderColor: 'transparent',
              boxShadow: '0 3px 10px rgba(2,132,199,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 5px 16px rgba(2,132,199,0.45)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 3px 10px rgba(2,132,199,0.3)'}
          >
            <PlusCircle style={{ width: '14px', height: '14px' }} />
            Order Baru / PO
          </button>

          {/* Terima Bahan */}
          <button
            onClick={onOpenStockIn}
            style={{ ...navBtnBase, background: '#F0FDF4', color: '#16A34A', borderColor: '#86EFAC' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#DCFCE7'; e.currentTarget.style.borderColor = '#4ADE80'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.borderColor = '#86EFAC'; }}
          >
            <Package style={{ width: '14px', height: '14px' }} />
            Terima Bahan
          </button>

          {/* Input OPEX */}
          <button
            onClick={onOpenOpex}
            style={{ ...navBtnBase, background: '#F0F9FF', color: '#0284C7', borderColor: '#BAE6FD' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E0F2FE'; e.currentTarget.style.borderColor = '#38BDF8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F0F9FF'; e.currentTarget.style.borderColor = '#BAE6FD'; }}
          >
            <TrendingUp style={{ width: '14px', height: '14px' }} />
            Input OPEX
          </button>

          {/* Supabase DDL */}
          <button
            onClick={onOpenDDL}
            style={{ ...navBtnBase, background: '#F5F3FF', color: '#6D28D9', borderColor: '#C4B5FD' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EDE9FE'; e.currentTarget.style.borderColor = '#A78BFA'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#C4B5FD'; }}
          >
            <Database style={{ width: '14px', height: '14px' }} />
            Supabase DDL
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: '#E2E8F0', margin: '0 0.25rem' }} />

          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 0.875rem',
            background: '#F0F9FF',
            border: '1.5px solid #BAE6FD',
            borderRadius: '0.625rem',
          }}>
            <UserCheck style={{ width: '14px', height: '14px', color: '#0284C7', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>{currentUser?.badge || 'Role'}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{currentUser?.name || 'User'}</div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Keluar dari Sistem"
            style={{
              width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '0.625rem',
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              cursor: 'pointer',
              color: '#94A3B8',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
          </button>

          {/* Reset */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            title="Reset Data ke Kondisi Awal"
            style={{
              width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '0.625rem',
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              cursor: 'pointer',
              color: '#94A3B8',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
          >
            <RefreshCw style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={resetData}
      />
    </header>
  );
};
