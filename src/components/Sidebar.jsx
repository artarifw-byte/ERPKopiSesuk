import React from 'react';
import { useERP } from '../context/ERPContext';
import {
  LayoutDashboard,
  ShoppingCart,
  CalendarCheck,
  PackageCheck,
  UtensilsCrossed,
  BookOpenCheck,
  BookOpen,
  Scale,
  TrendingUp,
  Landmark,
  BarChart3,
  Database,
  ShieldCheck,
  History,
  ReceiptText,
  X
} from 'lucide-react';

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, userRole, materials, calculateSSAndROP } = useERP();

  // Calculate critical and reorder materials count
  let criticalCount = 0;
  let reorderCount = 0;
  materials.forEach(mat => {
    const { status } = calculateSSAndROP(mat);
    if (status === 'CRITICAL') criticalCount++;
    if (status === 'REORDER') reorderCount++;
  });

  const menuGroups = [
    {
      title: 'OPERASIONAL TOKO',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard ERP',
          icon: LayoutDashboard,
          roles: ['super_admin', 'store_admin', 'kasir', 'finance']
        },
        {
          id: 'pos',
          label: 'POS Sales Kasir',
          icon: ShoppingCart,
          roles: ['super_admin', 'store_admin', 'kasir']
        },
        {
          id: 'orders',
          label: 'PO Schedule & Sales',
          icon: CalendarCheck,
          roles: ['super_admin', 'store_admin', 'kasir']
        },
        {
          id: 'inventory',
          label: 'Stok & Inventory Control',
          icon: PackageCheck,
          roles: ['super_admin', 'store_admin'],
          alertCount: criticalCount + reorderCount
        },
        {
          id: 'bom',
          label: 'Resep BOM (Takaran)',
          icon: UtensilsCrossed,
          roles: ['super_admin', 'store_admin']
        },
        {
          id: 'opex',
          label: 'Beban OPEX & CAPEX',
          icon: ReceiptText,
          roles: ['super_admin', 'store_admin', 'finance'],
          badge: 'Baru'
        }
      ]
    },
    {
      title: 'MODUL AKUNTANSI & KEUANGAN',
      isAccountingGroup: true,
      items: [
        {
          id: 'journal',
          label: 'Jurnal Umum (General Journal)',
          icon: BookOpenCheck,
          roles: ['super_admin', 'finance']
        },
        {
          id: 'ledger',
          label: 'Buku Besar (General Ledger)',
          icon: BookOpen,
          roles: ['super_admin', 'finance']
        },
        {
          id: 'trial-balance',
          label: 'Neraca Saldo (Trial Balance)',
          icon: Scale,
          roles: ['super_admin', 'finance']
        },
        {
          id: 'income-statement',
          label: 'Laporan Laba Rugi',
          icon: TrendingUp,
          roles: ['super_admin', 'finance']
        },
        {
          id: 'balance-sheet',
          label: 'Laporan Neraca',
          icon: Landmark,
          roles: ['super_admin', 'finance']
        }
      ]
    },
    {
      title: 'ANALISIS & SISTEM',
      items: [
        {
          id: 'reports',
          label: 'Laporan & BEP Analisis',
          icon: BarChart3,
          roles: ['super_admin', 'finance']
        },
        {
          id: 'audit',
          label: 'Audit Trail & Log',
          icon: History,
          roles: ['super_admin', 'store_admin', 'kasir', 'finance']
        },
        {
          id: 'ddl',
          label: 'Supabase DDL Schema',
          icon: Database,
          roles: ['super_admin', 'store_admin', 'kasir', 'finance'],
          highlight: true
        }
      ]
    }
  ];

  return (
    <aside className={`sidebar-container ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header at Top of Sidebar */}
      <div className="px-5 pt-8 pb-5 border-b border-slate-200 bg-white flex flex-col items-center gap-2 shrink-0 relative">
        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="mobile-sidebar-close"
            title="Tutup Menu"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        )}

        <div className="w-20 h-20 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shadow-sm overflow-hidden">
          <img
            src="/Logo Kopi Sesuk BG.png"
            alt="Kopi Sesuk Logo"
            style={{ width: '68px', height: '68px', objectFit: 'contain' }}
          />
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="font-black text-base tracking-tight text-slate-900 leading-none whitespace-nowrap">Kopi Sesuk</h1>
          <span className="text-xs font-extrabold text-sky-600 whitespace-nowrap">ERP v2.0</span>
        </div>
      </div>

      {/* Navigation Menu with Logical Categorized Groups (FSD v2.0 Section 3) */}
      <div className="sidebar-menu">
        {menuGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(userRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} style={{ marginBottom: '0.875rem' }}>
              <div
                className="sidebar-group-title"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  color: group.isAccountingGroup ? '#0284C7' : '#94A3B8'
                }}
              >
                <span>{group.title}</span>
                {group.isAccountingGroup && (
                  <span style={{
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '0.25rem',
                    background: '#E0F2FE',
                    color: '#0369A1'
                  }}>
                    v2.0
                  </span>
                )}
              </div>

              {visibleItems.map(item => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                    title={item.label}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: 1, marginRight: '0.5rem' }}>
                      <Icon
                        style={{
                          width: '18px',
                          height: '18px',
                          flexShrink: 0,
                          color: isActive ? '#FFFFFF' : item.highlight ? '#0284C7' : '#64748B'
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.label}
                      </span>
                    </div>

                    {(item.alertCount > 0 || item.badge) && (
                      <div className="shrink-0 ml-2">
                        {item.alertCount > 0 ? (
                          <span className={`sidebar-badge-pill ${
                            isActive ? 'bg-white text-sky-700 font-bold' : 'bg-amber-100 text-amber-800 font-bold'
                          }`}>
                            {item.alertCount} Warning
                          </span>
                        ) : (
                          <span className={`sidebar-badge-pill ${
                            isActive ? 'bg-sky-600 text-white font-bold' : 'bg-slate-100 text-slate-600 font-bold'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar Health Widget Wrapped in Modern Card */}
      <div style={{ padding: '0.875rem', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', flexShrink: 0 }}>
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: '1rem',
          padding: '0.875rem',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem'
        }}>
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{
                width: '26px', height: '26px',
                borderRadius: '0.5rem',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ShieldCheck style={{ width: '15px', height: '15px', color: '#059669' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                Status Persediaan
              </span>
            </div>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              background: '#F1F5F9',
              color: '#475569',
              border: '1px solid #E2E8F0'
            }}>
              {materials.length} Bahan
            </span>
          </div>

          {/* Status Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {/* SAFE */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.4rem 0.625rem',
              background: '#F0FDF4',
              border: '1px solid #DCFCE7',
              borderRadius: '0.5rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.725rem', fontWeight: 700, color: '#166534' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '9999px', background: '#22C55E' }} />
                SAFE (Aman)
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 900, color: '#15803D' }}>
                {materials.filter(m => calculateSSAndROP(m).status === 'SAFE').length} items
              </span>
            </div>

            {/* REORDER */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.4rem 0.625rem',
              background: reorderCount > 0 ? '#FFFBEB' : '#F8FAFC',
              border: `1px solid ${reorderCount > 0 ? '#FDE68A' : '#E2E8F0'}`,
              borderRadius: '0.5rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.725rem', fontWeight: 700, color: reorderCount > 0 ? '#92400E' : '#64748B' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '9999px', background: reorderCount > 0 ? '#F59E0B' : '#CBD5E1' }} />
                REORDER
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 900, color: reorderCount > 0 ? '#B45309' : '#94A3B8' }}>
                {reorderCount} items
              </span>
            </div>

            {/* CRITICAL */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.4rem 0.625rem',
              background: criticalCount > 0 ? '#FEF2F2' : '#F8FAFC',
              border: `1px solid ${criticalCount > 0 ? '#FECACA' : '#E2E8F0'}`,
              borderRadius: '0.5rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.725rem', fontWeight: 700, color: criticalCount > 0 ? '#991B1B' : '#64748B' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '9999px', background: criticalCount > 0 ? '#EF4444' : '#CBD5E1' }} />
                CRITICAL
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 900, color: criticalCount > 0 ? '#DC2626' : '#94A3B8' }}>
                {criticalCount} items
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
