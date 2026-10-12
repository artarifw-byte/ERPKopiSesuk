import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  PieChart,
  Target,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Award
} from 'lucide-react';

export const ReportsModule = () => {
  const { calculateFinancials, opex, orders, products, journal } = useERP();
  const fin = calculateFinancials();

  const [activeView, setActiveView] = useState('ALL'); // 'ALL', 'CHARTS', 'STATEMENT'
  const [hoveredOpex, setHoveredOpex] = useState(null);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const csvContent = [
      ['Keterangan Komponen', 'Jumlah (Rp)'],
      ['Pendapatan Kotor Sales', fin.totalRevenue],
      ['Total HPP (BOM Deduction)', fin.totalHPP],
      ['Laba Kotor (Gross Profit)', fin.grossProfit],
      ['Total Beban Operasional (OPEX)', fin.totalOpex],
      ['Laba Bersih (Net Profit)', fin.netProfit],
      ['Margin Keuntungan (%)', fin.marginPercent + '%'],
      ['Target BEP Porsi (Cup)', fin.bepCups],
      ['Target BEP Batch (14 Porsi)', fin.bepBatches]
    ].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Laba_Rugi_Kopi_Sesuk_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isProfit = fin.netProfit >= 0;

  // 1. BEP Progress Calculations
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const totalCupsSold = completedOrders.reduce((sum, ord) => {
    return sum + (ord.items || []).reduce((iSum, it) => iSum + (Number(it.qty) || 0), 0);
  }, 0);
  const bepTargetCups = fin.bepCups || 220;
  const bepProgress = Math.min(100, Math.round((totalCupsSold / bepTargetCups) * 100));
  const remainingCups = Math.max(0, bepTargetCups - totalCupsSold);

  // 2. OPEX Slices Calculations for Donut Chart
  const opexCategories = {};
  let totalOpexSum = 0;
  opex.forEach(item => {
    const amt = Number(item.amount) || 0;
    opexCategories[item.category] = (opexCategories[item.category] || 0) + amt;
    totalOpexSum += amt;
  });

  if (totalOpexSum === 0 && journal && journal.length > 0) {
    journal.forEach(entry => {
      (entry.items || []).forEach(item => {
        const code = String(item.accountCode || item.account_code || '');
        const debit = Number(item.debit) || 0;
        const credit = Number(item.credit) || 0;
        const diff = debit - credit;
        if (code === '601' && diff > 0) {
          const desc = entry.description || 'Biaya Operasional';
          let cat = 'Biaya Lain-lain';
          if (desc.includes('Thermal')) cat = 'Packaging Thermal Bag';
          else if (desc.includes('Modal')) cat = 'Modal Setup Awal';
          opexCategories[cat] = (opexCategories[cat] || 0) + diff;
          totalOpexSum += diff;
        }
      });
    });
  }

  const opexPalette = ['#0284C7', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#6366F1'];
  const opexSlices = Object.entries(opexCategories).map(([cat, amt], idx) => {
    const pct = totalOpexSum > 0 ? (amt / totalOpexSum) * 100 : 0;
    return {
      category: cat,
      amount: amt,
      percent: Math.round(pct * 10) / 10,
      color: opexPalette[idx % opexPalette.length]
    };
  });

  // 3. Product Sales Contribution
  const productSalesMap = {};
  completedOrders.forEach(ord => {
    (ord.items || []).forEach(it => {
      const name = `${it.productName} (${it.sizeLabel})`;
      if (!productSalesMap[name]) {
        productSalesMap[name] = { name, qty: 0, revenue: 0 };
      }
      productSalesMap[name].qty += Number(it.qty) || 0;
      productSalesMap[name].revenue += (Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
    });
  });
  const productSales = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  // Donut SVG circumference calculation
  const donutRadius = 52;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~326.72

  // Gauge SVG circumference calculation
  const gaugeRadius = 56;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius; // ~351.85

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 style={{ width: '22px', height: '22px', color: '#0284C7' }} />
            Laporan Keuangan & Visualisasi Analisis BEP
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
            Kinerja Finansial Real-Time, Proporsi Biaya OPEX, dan Target Titik Impas
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 1rem', borderRadius: '0.625rem',
              fontSize: '0.8rem', fontWeight: 700,
              background: '#F0FDF4', color: '#16A34A',
              border: '1.5px solid #86EFAC', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
            onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}
          >
            <Download style={{ width: '14px', height: '14px' }} />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 1rem', borderRadius: '0.625rem',
              fontSize: '0.8rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #0284C7, #0369A1)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(2,132,199,0.3)',
            }}
          >
            <Printer style={{ width: '14px', height: '14px' }} />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* TOP ROW: VISUAL FINANCIAL FLOW & SUMMARY CARDS */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp style={{ width: '18px', height: '18px', color: '#0284C7' }} />
              Grafik Komparasi Arus Finansial & Struktur Margin
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
              Perbandingan Pendapatan, HPP Bahan Baku, OPEX, dan Laba Bersih
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', fontWeight: 700 }}>
              Gross Margin: {fin.totalRevenue > 0 ? ((fin.grossProfit / fin.totalRevenue) * 100).toFixed(1) : 0}%
            </span>
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: isProfit ? '#F0FDF4' : '#FEF2F2', color: isProfit ? '#15803D' : '#DC2626', border: `1px solid ${isProfit ? '#86EFAC' : '#FCA5A5'}`, fontWeight: 700 }}>
              Net Margin: {fin.marginPercent}%
            </span>
          </div>
        </div>

        {/* Comparative Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 1. Pendapatan Kotor */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
              <span style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#0284C7', display: 'inline-block' }}></span>
                Pendapatan Kotor (Total Sales)
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284C7' }}>
                Rp {fin.totalRevenue.toLocaleString('id-ID')} <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem' }}>(100%)</span>
              </span>
            </div>
            <div style={{ width: '100%', height: '14px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, #0284C7, #38BDF8)',
                borderRadius: '9999px',
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>

          {/* 2. Total HPP (BOM) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
              <span style={{ fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#F59E0B', display: 'inline-block' }}></span>
                Total HPP Bahan Baku (Deduksi BOM)
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#D97706' }}>
                Rp {fin.totalHPP.toLocaleString('id-ID')} <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem' }}>({fin.totalRevenue > 0 ? ((fin.totalHPP / fin.totalRevenue) * 100).toFixed(1) : 0}%)</span>
              </span>
            </div>
            <div style={{ width: '100%', height: '14px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${fin.totalRevenue > 0 ? Math.min(100, (fin.totalHPP / fin.totalRevenue) * 100) : 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                borderRadius: '9999px',
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>

          {/* 3. Laba Kotor */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
              <span style={{ fontWeight: 700, color: '#15803D', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#16A34A', display: 'inline-block' }}></span>
                Laba Kotor (Gross Profit)
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#16A34A' }}>
                Rp {fin.grossProfit.toLocaleString('id-ID')} <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem' }}>({fin.totalRevenue > 0 ? ((fin.grossProfit / fin.totalRevenue) * 100).toFixed(1) : 0}%)</span>
              </span>
            </div>
            <div style={{ width: '100%', height: '14px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${fin.totalRevenue > 0 ? Math.max(0, Math.min(100, (fin.grossProfit / fin.totalRevenue) * 100)) : 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #16A34A, #4ADE80)',
                borderRadius: '9999px',
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>

          {/* 4. Beban Operasional (OPEX) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
              <span style={{ fontWeight: 700, color: '#6B21A8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#8B5CF6', display: 'inline-block' }}></span>
                Beban Operasional Toko (OPEX)
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#7C3AED' }}>
                Rp {fin.totalOpex.toLocaleString('id-ID')} <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem' }}>({fin.totalRevenue > 0 ? ((fin.totalOpex / fin.totalRevenue) * 100).toFixed(1) : 0}%)</span>
              </span>
            </div>
            <div style={{ width: '100%', height: '14px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${fin.totalRevenue > 0 ? Math.min(100, (fin.totalOpex / Math.max(fin.totalRevenue, fin.totalOpex)) * 100) : 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                borderRadius: '9999px',
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>

          {/* 5. Laba / Rugi Bersih */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
              <span style={{ fontWeight: 800, color: isProfit ? '#15803D' : '#991B1B', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: isProfit ? '#16A34A' : '#DC2626', display: 'inline-block' }}></span>
                {isProfit ? 'Laba Bersih Real-Time' : 'Defisit / Rugi Bersih Real-Time'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: isProfit ? '#16A34A' : '#DC2626' }}>
                Rp {fin.netProfit.toLocaleString('id-ID')}
              </span>
            </div>
            <div style={{ width: '100%', height: '14px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.max(10, Math.abs(fin.netProfit) / (fin.totalOpex || 1) * 100))}%`,
                height: '100%',
                background: isProfit ? 'linear-gradient(90deg, #16A34A, #22C55E)' : 'linear-gradient(90deg, #DC2626, #F87171)',
                borderRadius: '9999px',
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: 2 CHARTS (BEP GAUGE & OPEX DONUT) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>

        {/* CHART 1: GRAFIK BEP PROGRESS GAUGE */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target style={{ width: '18px', height: '18px', color: '#0284C7' }} />
                  Grafik Progres Titik Impas (BEP)
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                  Target Volume Cup (@250ml) Penutup Biaya OPEX
                </p>
              </div>
              <span style={{
                fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                padding: '0.2rem 0.6rem', borderRadius: '9999px',
                background: bepProgress >= 100 ? '#DCFCE7' : '#FEF3C7',
                color: bepProgress >= 100 ? '#15803D' : '#B45309',
                border: `1px solid ${bepProgress >= 100 ? '#86EFAC' : '#FDE68A'}`
              }}>
                {bepProgress >= 100 ? 'BEP TERCAPAI' : 'PROGRES BEP'}
              </span>
            </div>

            {/* Circular Meter SVG */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 0' }}>
              <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background Track */}
                  <circle
                    cx="75"
                    cy="75"
                    r={gaugeRadius}
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="14"
                  />
                  {/* Progress Arc */}
                  <circle
                    cx="75"
                    cy="75"
                    r={gaugeRadius}
                    fill="none"
                    stroke={bepProgress >= 100 ? '#10B981' : '#0284C7'}
                    strokeWidth="14"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeCircumference - (gaugeCircumference * (bepProgress / 100))}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>

                {/* Center Value */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#0F172A', lineHeight: 1 }}>
                    {bepProgress}%
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, marginTop: '0.2rem' }}>
                    Realisasi
                  </span>
                </div>
              </div>
            </div>

            {/* BEP Stats Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1.5px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Terjual Saat Ini</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.125rem', color: '#0284C7', marginTop: '0.15rem' }}>
                  {totalCupsSold} <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Cup</span>
                </div>
              </div>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1.5px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Target BEP</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.125rem', color: '#0F172A', marginTop: '0.15rem' }}>
                  {bepTargetCups} <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Cup</span>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Note */}
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: bepProgress >= 100 ? '#F0FDF4' : '#EFF6FF', borderRadius: '0.75rem', border: `1.5px solid ${bepProgress >= 100 ? '#86EFAC' : '#BFDBFE'}`, fontSize: '0.78rem', color: bepProgress >= 100 ? '#15803D' : '#1E40AF', lineHeight: 1.5 }}>
            {bepProgress >= 100 ? (
              <span>🎉 <strong>Selamat!</strong> Penjualan telah melampaui titik impas (BEP). Setiap penjualan berikutnya menghasilkan laba bersih langsung!</span>
            ) : (
              <span>🎯 <strong>Sisa Target:</strong> Butuh <strong>{remainingCups} cup lagi</strong> ({Math.ceil(remainingCups / 14)} batch) untuk mencapai titik impas operasional bulan ini.</span>
            )}
          </div>
        </div>

        {/* CHART 2: GRAFIK DONUT PROPORSI BIAYA OPEX */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PieChart style={{ width: '18px', height: '18px', color: '#7C3AED' }} />
                  Grafik Komposisi Beban OPEX
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                  Alokasi Pengeluaran Operasional Toko
                </p>
              </div>
              <span style={{
                fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                padding: '0.2rem 0.6rem', borderRadius: '9999px',
                background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE'
              }}>
                Total Rp {(totalOpexSum / 1000000).toFixed(2)}M
              </span>
            </div>

            {/* Donut Chart and Legends */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.5rem 0', flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* Donut SVG */}
              <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
                <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Gray background track */}
                  <circle cx="70" cy="70" r={donutRadius} fill="none" stroke="#F1F5F9" strokeWidth="20" />
                  
                  {/* Dynamic Slices */}
                  {(() => {
                    let cumulativePercent = 0;
                    return opexSlices.map((slice, i) => {
                      const strokeDasharray = `${(slice.percent / 100) * donutCircumference} ${donutCircumference}`;
                      const strokeDashoffset = -((cumulativePercent / 100) * donutCircumference);
                      cumulativePercent += slice.percent;

                      return (
                        <circle
                          key={i}
                          cx="70"
                          cy="70"
                          r={donutRadius}
                          fill="none"
                          stroke={slice.color}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          style={{ transition: 'all 0.5s ease', cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredOpex(slice)}
                          onMouseLeave={() => setHoveredOpex(null)}
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Donut Center */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', pointerEvents: 'none'
                }}>
                  <Layers style={{ width: '16px', height: '16px', color: '#7C3AED', marginBottom: '2px' }} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                    OPEX
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#0F172A' }}>
                    100%
                  </span>
                </div>
              </div>

              {/* Legends List */}
              <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {opexSlices.map((slice, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.35rem 0.5rem', borderRadius: '0.5rem',
                      background: hoveredOpex?.category === slice.category ? '#F8FAFC' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: slice.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                        {slice.category}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: '#0F172A' }}>
                        {slice.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
            <span>Beban Terbesar: <strong>{opexSlices[0]?.category || 'Sewa Tempat'}</strong></span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#7C3AED' }}>Rp {(opexSlices[0]?.amount || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: INCOME STATEMENT & OPEX TABLE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>

        {/* Laporan Laba Rugi (Income Statement) */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.875rem', borderBottom: '1.5px solid #E2E8F0', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: '0.9375rem' }}>Laporan Laba Rugi (Income Statement)</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>Periode Akuntansi Oktober 2026</p>
            </div>
            <span style={{
              padding: '0.25rem 0.65rem', borderRadius: '9999px',
              fontSize: '0.7rem', fontWeight: 800,
              background: '#EFF6FF', color: '#1D4ED8',
              border: '1.5px solid #BFDBFE',
            }}>
              Real-Time
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Revenue */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>Pendapatan Kotor Sales</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1rem', color: '#0284C7' }}>
                Rp {fin.totalRevenue.toLocaleString('id-ID')}
              </span>
            </div>

            {/* HPP */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0 0.7rem 0.75rem', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#64748B', fontSize: '0.8125rem' }}>(-) Total Harga Pokok Penjualan (HPP BOM)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#DC2626', fontSize: '0.875rem' }}>
                (Rp {fin.totalHPP.toLocaleString('id-ID')})
              </span>
            </div>

            {/* Gross Profit */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.75rem 1rem', margin: '0.5rem 0',
              background: '#F0FDF4', borderRadius: '0.75rem', border: '1.5px solid #86EFAC',
            }}>
              <span style={{ fontWeight: 800, color: '#15803D', fontSize: '0.875rem' }}>Laba Kotor (Gross Profit)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#16A34A', fontSize: '1rem' }}>
                Rp {fin.grossProfit.toLocaleString('id-ID')}
              </span>
            </div>

            {/* OPEX */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0 0.7rem 0.75rem', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#64748B', fontSize: '0.8125rem' }}>(-) Total Beban Operasional (OPEX)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#7C3AED', fontSize: '0.875rem' }}>
                (Rp {fin.totalOpex.toLocaleString('id-ID')})
              </span>
            </div>

            {/* Net Profit */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1rem 1.125rem', marginTop: '0.5rem',
              background: isProfit ? 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' : 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
              borderRadius: '0.875rem',
              border: `1.5px solid ${isProfit ? '#86EFAC' : '#FCA5A5'}`,
            }}>
              <div>
                <span style={{ fontWeight: 900, color: '#0F172A', fontSize: '0.9375rem', display: 'block' }}>Laba Bersih Real-Time (Net Profit)</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Profit Margin: <strong style={{ color: isProfit ? '#16A34A' : '#DC2626' }}>{fin.marginPercent}%</strong>
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.35rem', color: isProfit ? '#16A34A' : '#DC2626' }}>
                Rp {fin.netProfit.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* OPEX Details Table */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <h3 style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9375rem' }}>
              📋 Rincian Transaksi OPEX Terjadwal
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
              {opex.length} Item Pengeluaran
            </span>
          </div>

          <div className="table-container" style={{ borderRadius: '0.75rem' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Keterangan</th>
                  <th style={{ textAlign: 'right' }}>Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {opex.map((op) => (
                  <tr key={op.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748B' }}>{op.date}</td>
                    <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{op.category}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748B' }}>{op.description}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#7C3AED', fontSize: '0.8rem' }}>
                      Rp {op.amount.toLocaleString('id-ID')}
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
