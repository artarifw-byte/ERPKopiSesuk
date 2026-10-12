import React from 'react';
import { useERP } from '../context/ERPContext';
import {
  DollarSign,
  TrendingUp,
  Package,
  CalendarCheck,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  PieChart,
} from 'lucide-react';

export const Dashboard = ({ onOpenNewOrder, onOpenStockIn, onOpenOpex, onOpenDDL }) => {
  const {
    orders,
    materials,
    calculateFinancials,
    calculateSSAndROP,
    completeOrder,
    setActiveTab
  } = useERP();

  const fin = calculateFinancials();

  // Find critical / reorder materials
  const warningMaterials = materials
    .map(m => ({ ...m, ...calculateSSAndROP(m) }))
    .filter(m => m.status !== 'SAFE');

  const criticalMaterials = warningMaterials.filter(m => m.status === 'CRITICAL');
  const reorderMaterials = warningMaterials.filter(m => m.status === 'REORDER');

  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #1D4ED8 100%)',
          borderRadius: '1.25rem',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.28)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
            <span style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(4px)',
              letterSpacing: '0.02em',
              color: '#ffffff'
            }}>
              Web & Mobile ERP System
            </span>
            <span style={{ fontSize: '0.75rem', color: '#BAE6FD', fontWeight: 600 }}>
              Oktober 2026
            </span>
          </div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 0.375rem 0' }}>
            Sistem ERP Terpusat — Kopi Sesuk
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#E0F2FE', maxWidth: '42rem', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
            Manajemen Stok Terpusat, Kalkulasi BOM Porsi & Botol 1L, Pemrosesan Jadwal PO/CFD, serta Otomatisasi Akuntansi Double-Entry.
          </p>
        </div>
      </div>

      {/* Critical Stock Alert Banner (Merah / Red) */}
      {criticalMaterials.length > 0 && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            borderRadius: '1rem',
            padding: '1.1rem 1.35rem',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.08)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '42px', height: '42px',
              borderRadius: '0.75rem',
              background: '#FEE2E2',
              border: '1.5px solid #FECACA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#DC2626',
              flexShrink: 0
            }}>
              <ShieldAlert style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#991B1B', margin: 0 }}>
                Peringatan Stok Kritis (Critical Stock Alert)
              </h4>
              <p style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600, margin: '0.2rem 0 0 0' }}>
                Terdapat <strong style={{ fontWeight: 800 }}>{criticalMaterials.length} bahan baku</strong> ({criticalMaterials.map(m => m.name).join(', ')}) berada di bawah Safety Stock (Kritis)! Segera restok.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            <button
              onClick={() => setActiveTab('inventory')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '0.625rem',
                fontSize: '0.8rem', fontWeight: 700,
                background: '#FFFFFF',
                color: '#DC2626',
                border: '1.5px solid #FCA5A5',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.borderColor = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
            >
              Lihat Detail Inventory
              <ArrowUpRight style={{ width: '14px', height: '14px' }} />
            </button>
            <button
              onClick={onOpenStockIn}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '0.625rem',
                fontSize: '0.8rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(220, 38, 38, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 5px 16px rgba(220, 38, 38, 0.5)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 3px 10px rgba(220, 38, 38, 0.35)'}
            >
              Penerimaan Stok
            </button>
          </div>
        </div>
      )}

      {/* Reorder Point Alert Banner (Kuning-Oranye / Amber) */}
      {reorderMaterials.length > 0 && (
        <div
          style={{
            background: '#FFFBEB',
            border: '1.5px solid #FDE68A',
            borderRadius: '1rem',
            padding: '1.1rem 1.35rem',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '42px', height: '42px',
              borderRadius: '0.75rem',
              background: '#FEF3C7',
              border: '1.5px solid #FDE68A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#D97706',
              flexShrink: 0
            }}>
              <AlertTriangle style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#92400E', margin: 0 }}>
                Peringatan Reorder Point (Safety Stock Alert)
              </h4>
              <p style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600, margin: '0.2rem 0 0 0' }}>
                Terdapat <strong style={{ fontWeight: 800 }}>{reorderMaterials.length} bahan baku</strong> ({reorderMaterials.map(m => m.name).join(', ')}) menyentuh batas pemesanan ulang (ROP).
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            <button
              onClick={() => setActiveTab('inventory')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '0.625rem',
                fontSize: '0.8rem', fontWeight: 700,
                background: '#FFFFFF',
                color: '#B45309',
                border: '1.5px solid #FDE68A',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEF3C7'; e.currentTarget.style.borderColor = '#F59E0B'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#FDE68A'; }}
            >
              Lihat Detail Inventory
              <ArrowUpRight style={{ width: '14px', height: '14px' }} />
            </button>
            <button
              onClick={onOpenStockIn}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '0.625rem',
                fontSize: '0.8rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #D97706, #B45309)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(217, 119, 6, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 5px 16px rgba(217, 119, 6, 0.5)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 3px 10px rgba(217, 119, 6, 0.35)'}
            >
              Penerimaan Stok
            </button>
          </div>
        </div>
      )}


      {/* Real-Time Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Revenue */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pendapatan Kotor</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            Rp {fin.totalRevenue.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span className="text-emerald-700 font-bold">{completedOrders.length} order</span> telah di-posting
          </p>
        </div>

        {/* Total HPP */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total HPP (BOM)</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-700 font-mono">
            Rp {fin.totalHPP.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Deduksi stok bahan baku otomatis
          </p>
        </div>

        {/* Total OPEX */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biaya Operasional (OPEX)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">
            Rp {fin.totalOpex.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Sewa, Listrik, Marketing & Packaging
          </p>
        </div>

        {/* Net Profit */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Laba Bersih Real-Time</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono ${fin.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            Rp {fin.netProfit.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            Profit Margin: <span className="font-bold text-slate-900">{fin.marginPercent}%</span>
          </p>
        </div>
      </div>

      {/* BEP Analysis & Inventory Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BEP Gauge Card */}
        <div className="glass-card lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Analisis Break-Even Point (BEP)</h3>
              <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded font-mono font-bold">Auto Calculated</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Target volume penjualan untuk menutup seluruh beban operasional (OPEX Rp {fin.totalOpex.toLocaleString('id-ID')}).
            </p>

            {/* Visual Realization Progress */}
            {(() => {
              const totalCupsSold = completedOrders.reduce((sum, ord) => {
                return sum + (ord.items || []).reduce((iSum, it) => iSum + (Number(it.qty) || 0), 0);
              }, 0);
              const bepPercent = Math.min(100, Math.round((totalCupsSold / (fin.bepCups || 1)) * 100));
              const remainingCups = Math.max(0, (fin.bepCups || 220) - totalCupsSold);

              return (
                <div style={{ marginBottom: '1rem', padding: '0.875rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1.5px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Progres Realisasi BEP</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0284C7' }}>{bepPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ width: `${bepPercent}%`, height: '100%', background: 'linear-gradient(90deg, #0284C7, #38BDF8)', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B' }}>
                    <span>Terjual: <strong style={{ color: '#0F172A' }}>{totalCupsSold} cup</strong></span>
                    <span>Sisa: <strong style={{ color: '#0284C7' }}>{remainingCups} cup</strong></span>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3">
              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100">
                <span className="text-xs text-slate-600 font-bold">BEP Target Porsi Cup</span>
                <div className="text-2xl font-mono font-black text-sky-700 mt-0.5">
                  {fin.bepCups} <span className="text-xs text-slate-500 font-sans font-normal">cup (@250ml)</span>
                </div>
              </div>

              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100">
                <span className="text-xs text-slate-600 font-bold">BEP Target Batch Porsi</span>
                <div className="text-2xl font-mono font-black text-sky-700 mt-0.5">
                  {fin.bepBatches} <span className="text-xs text-slate-500 font-sans font-normal">batch (14 porsi/batch)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
            *Dihitung berdasarkan takaran rata-rata margin kontribusi Kopi Sesuk.
          </div>
        </div>

        {/* Recent Orders & PO Schedule */}
        <div className="glass-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Jadwal PO & Penjualan Terkini</h3>
              <p className="text-xs text-slate-500 font-medium">Daftar transaksi dan pesanan terbaru pelanggan Kopi Sesuk</p>
            </div>

            <button
              onClick={() => setActiveTab('orders')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.875rem',
                borderRadius: '0.625rem',
                fontSize: '0.8rem', fontWeight: 700,
                background: '#F0F9FF',
                color: '#0284C7',
                border: '1.5px solid #BAE6FD',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E0F2FE'; e.currentTarget.style.borderColor = '#38BDF8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F0F9FF'; e.currentTarget.style.borderColor = '#BAE6FD'; }}
            >
              Lihat Semua Order
              <ArrowUpRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No. Order</th>
                  <th>Nama Pelanggan</th>
                  <th>Tgl Pengiriman</th>
                  <th>Total Sales</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id}>
                    <td className="font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                    <td>
                      <div className="font-bold text-slate-900">{ord.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{ord.paymentMethod}</div>
                    </td>
                    <td className="text-xs text-slate-600 font-mono">{ord.deliveryDate}</td>
                    <td className="font-mono font-bold text-slate-900">
                      Rp {(ord.totalAmount || 0).toLocaleString('id-ID')}
                    </td>
                    <td>
                      <span className={`badge ${ord.status === 'COMPLETED' ? 'badge-completed' : 'badge-pending'}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td>
                      {ord.status === 'PENDING' ? (
                        <button
                          onClick={() => completeOrder(ord.id)}
                          className="btn btn-success btn-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selesaikan Order</span>
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-mono font-bold">BOM Deducted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
