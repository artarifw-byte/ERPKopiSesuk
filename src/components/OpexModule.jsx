import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import {
  ReceiptText,
  PlusCircle,
  Search,
  Filter,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Image,
  Eye,
  Trash2,
  Flame,
  Wrench,
  Store,
  FileText,
  ArrowRight,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UploadCloud,
  X,
  PackageX
} from 'lucide-react';

export const OpexModule = () => {
  const { opex, addOpex, journal, coa, getVariantsWithHPP, showToast } = useERP();

  // Search & Filter State (FSD v1.1 Section 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('ALL'); // ALL, THIS_MONTH, LAST_MONTH, THIS_YEAR, CUSTOM
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Pagination State (FSD v1.1 Section 3: Tepat 10 items/page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCfdWasteModalOpen, setIsCfdWasteModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // New Transaction Form State (FSD v1.1 Section 2)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    opexType: 'OPEX_RUTIN', // OPEX_RUTIN, OPEX_WASTE_CFD, CAPEX_PERALATAN, CAPEX_PERLENGKAPAN
    category: 'Biaya Listrik & Utilitas',
    description: '',
    amount: '',
    paymentMethod: 'CASH', // CASH, QRIS, TRANSFER, HUTANG
    paymentAccountCode: '101',
    benefitMonths: 24, // Khusus CAPEX
    receiptImage: null,
    receiptPreview: null
  });

  // CFD Sisa Produk & Waste Calculator State (FSD v1.1 Section 4)
  const variants = useMemo(() => getVariantsWithHPP() || [], [getVariantsWithHPP]);
  const [cfdSessionDate, setCfdSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [cfdLocation, setCfdLocation] = useState('Car Free Day (CFD) Sudirman');
  const [cfdItems, setCfdItems] = useState([
    { variantId: '', qtyBrought: 30, qtySold: 25, qtyUnsold: 5 },
    { variantId: '', qtyBrought: 20, qtySold: 18, qtyUnsold: 2 }
  ]);

  // Pre-fill variant IDs for CFD
  React.useEffect(() => {
    if (variants.length > 0 && (!cfdItems[0].variantId || !cfdItems[1]?.variantId)) {
      setCfdItems([
        { variantId: variants[0]?.id || '', qtyBrought: 30, qtySold: 26, qtyUnsold: 4 },
        { variantId: variants[1]?.id || variants[0]?.id || '', qtyBrought: 20, qtySold: 18, qtyUnsold: 2 }
      ]);
    }
  }, [variants]);

  // Category definitions per FSD v1.1
  const categoryOptions = {
    OPEX_RUTIN: [
      'Biaya Kebersihan & Keamanan',
      'Biaya Listrik & Utilitas',
      'Biaya Air Bersih',
      'Sewa Tempat & Booth CFD',
      'BPP Tambahan / Logistik',
      'Biaya Sampah & Lingkungan',
      'Pemasaran & Stiker Promosi',
      'Packaging Tambahan',
      'Gaji & Uang Makan Tim CFD',
      'Lain-lain Operasional'
    ],
    OPEX_WASTE_CFD: [
      'Produk Rusak / Tumpah saat CFD',
      'Produk Olahan CFD Kadaluarsa / Basi',
      'Sisa Produk Olahan CFD Tidak Laku'
    ],
    CAPEX_PERALATAN: [
      'Mesin Espresso Toko',
      'Mesin Grinder Kopi Komersial',
      'Blender Heavy Duty',
      'Coolbox Besar CFD',
      'Kulkas & Chiller Bahan'
    ],
    CAPEX_PERLENGKAPAN: [
      'Meja Lipat CFD',
      'Canopy Tent / Tenda Promosi CFD',
      'Banner Promosi & X-Banner',
      'Signage Papan Menu Neon / Kayu'
    ]
  };

  // Helper to determine transaction classification
  const classifyItem = (item) => {
    const cat = item.category || '';
    const desc = item.description || '';
    if (cat.includes('Waste') || desc.includes('Waste') || cat.includes('Sisa Produk CFD')) {
      return {
        type: 'OPEX_WASTE_CFD',
        badge: 'OPEX Waste CFD',
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FCA5A5',
        debet: '504 (Beban Waste)',
        kredit: '102 (Persediaan)'
      };
    }
    if (cat.includes('Mesin') || cat.includes('Grinder') || cat.includes('Blender') || cat.includes('Coolbox') || cat.includes('CAPEX Peralatan') || desc.includes('[CAPEX Peralatan]')) {
      return {
        type: 'CAPEX_PERALATAN',
        badge: 'CAPEX Peralatan',
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
        debet: '103 (Aset Peralatan)',
        kredit: item.paymentAccountCode === '201' ? '201 (Hutang)' : '101 (Kas/Bank)'
      };
    }
    if (cat.includes('Meja Lipat') || cat.includes('Canopy') || cat.includes('Banner') || cat.includes('Signage') || cat.includes('CAPEX Perlengkapan') || desc.includes('[CAPEX Perlengkapan]')) {
      return {
        type: 'CAPEX_PERLENGKAPAN',
        badge: 'CAPEX Perlengkapan',
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        debet: '104 (Aset Perlengkapan)',
        kredit: '101 (Kas/Bank)'
      };
    }
    return {
      type: 'OPEX_RUTIN',
      badge: 'OPEX Rutin',
      color: '#0284C7',
      bg: '#F0F9FF',
      border: '#BAE6FD',
      debet: '502 (Beban Operasional)',
      kredit: '101 (Kas/Bank)'
    };
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    let rutinSum = 0;
    let wasteSum = 0;
    let capexSum = 0;
    let totalCashOutflow = 0;

    (opex || []).forEach(op => {
      const amt = Number(op.amount) || 0;
      const c = classifyItem(op);
      if (c.type === 'OPEX_RUTIN') rutinSum += amt;
      else if (c.type === 'OPEX_WASTE_CFD') wasteSum += amt;
      else if (c.type === 'CAPEX_PERALATAN' || c.type === 'CAPEX_PERLENGKAPAN') capexSum += amt;

      // Check cash outflow (kredit 101)
      if (op.paymentAccountCode !== '201' && c.type !== 'OPEX_WASTE_CFD') {
        totalCashOutflow += amt;
      }
    });

    return { rutinSum, wasteSum, capexSum, totalCashOutflow };
  }, [opex]);

  // Filtering Logic (FSD v1.1 Section 3)
  const filteredData = useMemo(() => {
    return (opex || []).filter(item => {
      // 1. Global Keyword Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.id || '').toLowerCase().includes(q) ||
        (item.expense_date || item.date || '').toLowerCase().includes(q) ||
        String(item.amount || '').includes(q);

      if (!matchSearch) return false;

      // 2. Category / Type Filter
      if (categoryFilter !== 'ALL') {
        const c = classifyItem(item);
        if (c.type !== categoryFilter) return false;
      }

      // 3. Date / Period Filter
      const itemDate = new Date(item.expense_date || item.date);
      const now = new Date();
      if (periodFilter === 'THIS_MONTH') {
        if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (periodFilter === 'LAST_MONTH') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        if (itemDate.getMonth() !== lastMonth || itemDate.getFullYear() !== lastYear) {
          return false;
        }
      } else if (periodFilter === 'THIS_YEAR') {
        if (itemDate.getFullYear() !== now.getFullYear()) return false;
      } else if (periodFilter === 'CUSTOM') {
        if (startDate && (item.expense_date || item.date) < startDate) return false;
        if (endDate && (item.expense_date || item.date) > endDate) return false;
      }

      return true;
    });
  }, [opex, searchQuery, periodFilter, startDate, endDate, categoryFilter]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, periodFilter, categoryFilter, startDate, endDate]);

  // Handle Form Input Submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      showToast('Nominal biaya wajib diisi dengan benar!', 'error');
      return;
    }

    let metaNote = '';
    if (formData.opexType === 'CAPEX_PERALATAN' || formData.opexType === 'CAPEX_PERLENGKAPAN') {
      const depMonthly = Math.round(Number(formData.amount) / (Number(formData.benefitMonths) || 12));
      metaNote = `[${formData.opexType === 'CAPEX_PERALATAN' ? 'CAPEX Peralatan' : 'CAPEX Perlengkapan'} ${formData.benefitMonths} bln, Depresiasi Rp ${depMonthly.toLocaleString('id-ID')}/bln] `;
    }

    const payload = {
      date: formData.date,
      category: formData.category,
      opexType: formData.opexType,
      description: `${metaNote}${formData.description.trim() || formData.category}`.trim(),
      amount: Number(formData.amount),
      paymentAccountCode: formData.paymentMethod === 'HUTANG' ? '201' : '101',
      benefitMonths: (formData.opexType === 'CAPEX_PERALATAN' || formData.opexType === 'CAPEX_PERLENGKAPAN') ? Number(formData.benefitMonths) : null,
      receiptData: formData.receiptPreview
    };

    await addOpex(payload);
    setIsAddModalOpen(false);

    // Reset Form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      opexType: 'OPEX_RUTIN',
      category: 'Biaya Listrik & Utilitas',
      description: '',
      amount: '',
      paymentMethod: 'CASH',
      paymentAccountCode: '101',
      benefitMonths: 24,
      receiptImage: null,
      receiptPreview: null
    });
  };

  // Handle Image Upload for Receipt
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          receiptImage: file.name,
          receiptPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // CFD Sisa Produk Calculation (FSD v1.1 Section 4)
  const cfdCalculations = useMemo(() => {
    let totalTerjualBOM = 0;
    let totalWasteBOM = 0;
    const summaryItems = [];

    cfdItems.forEach(item => {
      const v = variants.find(vr => vr.id === item.variantId);
      if (!v) return;
      const bomCost = Number(v.totalHPP || v.hpp || 3500);
      const terjual = Number(item.qtySold) || 0;
      const unsold = Math.max(0, Number(item.qtyUnsold) || 0);

      const hppSold = terjual * bomCost;
      const hppWaste = unsold * bomCost;

      totalTerjualBOM += hppSold;
      totalWasteBOM += hppWaste;

      summaryItems.push({
        name: `${v.productName} (${v.sizeLabel})`,
        qtyBrought: item.qtyBrought,
        qtySold: terjual,
        qtyUnsold: unsold,
        bomCost,
        hppSold,
        hppWaste
      });
    });

    return {
      summaryItems,
      totalTerjualBOM,
      totalWasteBOM,
      totalHppBatchKeluar: totalTerjualBOM + totalWasteBOM
    };
  }, [cfdItems, variants]);

  // Submit CFD Waste Settlement
  const handleSettleCfdWaste = async () => {
    if (cfdCalculations.totalWasteBOM <= 0) {
      showToast('Tidak ada sisa produk rusak/tidak terjual. Semua produk habis!', 'info');
      setIsCfdWasteModalOpen(false);
      return;
    }

    const itemNotes = cfdCalculations.summaryItems
      .filter(it => it.qtyUnsold > 0)
      .map(it => `${it.name}: ${it.qtyUnsold} sisa (@Rp ${Math.round(it.bomCost).toLocaleString('id-ID')})`)
      .join(', ');

    const payload = {
      date: cfdSessionDate,
      category: 'OPEX Waste CFD',
      opexType: 'OPEX_WASTE_CFD',
      description: `Alokasi Sisa Produk CFD (${cfdLocation}): ${itemNotes}`,
      amount: Math.round(cfdCalculations.totalWasteBOM),
      paymentAccountCode: '102' // Kredit Persediaan
    };

    await addOpex(payload);
    showToast(`Alokasi Waste CFD Rp ${Math.round(cfdCalculations.totalWasteBOM).toLocaleString('id-ID')} berhasil diposting ke Beban Waste (504)!`, 'success');
    setIsCfdWasteModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['No', 'Tanggal', 'Kategori', 'Tipe', 'Deskripsi', 'Nominal (Rp)', 'Akun Bayar', 'Debet (COA)', 'Kredit (COA)'];
    const rows = filteredData.map((item, idx) => {
      const c = classifyItem(item);
      return [
        idx + 1,
        item.expense_date || item.date,
        `"${item.category}"`,
        `"${c.badge}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`,
        item.amount,
        item.paymentAccountCode,
        `"${c.debet}"`,
        `"${c.kredit}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_OPEX_CAPEX_Kopi_Sesuk_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header with Title and Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 800,
              background: '#E0F2FE',
              color: '#0369A1',
              border: '1px solid #BAE6FD',
              letterSpacing: '0.04em'
            }}>
              OPERASIONAL & ASET
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              Modul Pengeluaran & Aset Terpusat
            </span>
          </div>
          <h2 style={{ fontWeight: 900, fontSize: '1.375rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <ReceiptText style={{ width: '24px', height: '24px', color: '#0284C7' }} />
            Beban Operasional (OPEX) & Investasi Aset (CAPEX)
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.2rem' }}>
            Pencatatan komprehensif pengeluaran rutin, penatausahaan aset fisik, dan beban kerugian sisa olahan CFD
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsCfdWasteModalOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.55rem 1rem', borderRadius: '0.75rem',
              fontSize: '0.8125rem', fontWeight: 700,
              background: '#FEF2F2', color: '#DC2626',
              border: '1.5px solid #FECACA', cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
            onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
          >
            <Flame style={{ width: '16px', height: '16px', color: '#DC2626' }} />
            Sesi CFD & Alokasi Waste
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.55rem 1rem', borderRadius: '0.75rem',
              fontSize: '0.8125rem', fontWeight: 700,
              background: '#FFFFFF', color: '#475569',
              border: '1.5px solid #E2E8F0', cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
          >
            <Download style={{ width: '15px', height: '15px', color: '#64748B' }} />
            Ekspor CSV
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.55rem 1.25rem', borderRadius: '0.75rem',
              fontSize: '0.8125rem', fontWeight: 800,
              background: 'linear-gradient(135deg, #0284C7, #0369A1)',
              color: '#FFFFFF', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <PlusCircle style={{ width: '16px', height: '16px' }} />
            Catat Pengeluaran Baru
          </button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OPEX Rutin */}
        <div className="glass-card" style={{ padding: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              OPEX Pengeluaran Rutin
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '0.5rem', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
              <TrendingDown style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
            Rp {metrics.rutinSum.toLocaleString('id-ID')}
          </div>
          <p style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.35rem' }}>
            Listrik, kebersihan, air, sewa tempat & logistik
          </p>
          <div style={{ marginTop: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.65rem', color: '#0284C7', fontWeight: 700 }}>
            (D) Beban Operasional 502 / (K) Kas 101
          </div>
        </div>

        {/* OPEX Waste CFD */}
        <div className="glass-card" style={{ padding: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              OPEX Waste CFD
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '0.5rem', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <PackageX style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#DC2626', fontFamily: 'var(--font-mono)' }}>
            Rp {metrics.wasteSum.toLocaleString('id-ID')}
          </div>
          <p style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.35rem' }}>
            Alokasi kerugian produk olahan rusak/tidak laku
          </p>
          <div style={{ marginTop: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.65rem', color: '#DC2626', fontWeight: 700 }}>
            (D) Beban Waste CFD 504 / (K) Persediaan 102
          </div>
        </div>

        {/* CAPEX Investasi Aset */}
        <div className="glass-card" style={{ padding: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CAPEX Investasi Aset
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '0.5rem', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
              <Wrench style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#7C3AED', fontFamily: 'var(--font-mono)' }}>
            Rp {metrics.capexSum.toLocaleString('id-ID')}
          </div>
          <p style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.35rem' }}>
            Mesin, grinder, coolbox, meja & perlengkapan
          </p>
          <div style={{ marginTop: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.65rem', color: '#7C3AED', fontWeight: 700 }}>
            (D) Aset Tetap 103/104 / (K) Kas/Hutang
          </div>
        </div>

        {/* Total Kas Keluar */}
        <div className="glass-card" style={{ padding: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Kas Keluar (Outflow)
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '0.5rem', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <DollarSign style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
            Rp {metrics.totalCashOutflow.toLocaleString('id-ID')}
          </div>
          <p style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.35rem' }}>
            Total pengeluaran kas tunai & bank riil
          </p>
          <div style={{ marginTop: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>
            Posting Jurnal: Kredit Akun Kas/Bank 101
          </div>
        </div>
      </div>

      {/* Filter, Search & Date Range Bar (FSD v1.1 Section 3) */}
      <div className="glass-card" style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
          {/* Global Search */}
          <div style={{ position: 'relative', width: '320px', minWidth: '240px' }}>
            <Search style={{ width: '15px', height: '15px', position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Cari biaya, kategori, no. ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.875rem 0.55rem 2.35rem',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '0.625rem',
                fontSize: '0.8125rem',
                color: '#0F172A',
                outline: 'none'
              }}
              onFocus={e => { e.target.style.borderColor = '#0284C7'; e.target.style.background = '#FFFFFF'; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.875rem',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '0.625rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#0F172A',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="ALL">Semua Jenis Biaya & Aset</option>
              <option value="OPEX_RUTIN">OPEX Pengeluaran Rutin</option>
              <option value="OPEX_WASTE_CFD">OPEX Waste CFD</option>
              <option value="CAPEX_PERALATAN">CAPEX Aset Peralatan</option>
              <option value="CAPEX_PERLENGKAPAN">CAPEX Perlengkapan Toko</option>
            </select>

            {/* Quick Period Filter Dropdown */}
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.875rem',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '0.625rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#0F172A',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="ALL">Semua Periode</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="LAST_MONTH">Bulan Lalu</option>
              <option value="THIS_YEAR">Tahun Ini</option>
              <option value="CUSTOM">Rentang Tanggal Kustom...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {periodFilter === 'CUSTOM' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem', background: '#F0F9FF',
            borderRadius: '0.625rem', border: '1px solid #BAE6FD',
            flexWrap: 'wrap'
          }}>
            <Calendar style={{ width: '15px', height: '15px', color: '#0284C7' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1' }}>Rentang Tanggal:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '0.4rem 0.65rem', background: '#FFFFFF',
                border: '1px solid #BAE6FD', borderRadius: '0.5rem',
                fontSize: '0.75rem', outline: 'none'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '0.4rem 0.65rem', background: '#FFFFFF',
                border: '1px solid #BAE6FD', borderRadius: '0.5rem',
                fontSize: '0.75rem', outline: 'none'
              }}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                style={{
                  fontSize: '0.75rem', color: '#0284C7', fontWeight: 700,
                  background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                Reset Tanggal
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Data Table (10 items / page) */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Tanggal</th>
                <th style={{ width: '110px' }}>No. Ref</th>
                <th>Jenis & Kategori</th>
                <th>Rincian / Keterangan</th>
                <th style={{ textAlign: 'right', width: '140px' }}>Nominal (Rp)</th>
                <th>Metode Bayar</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Bukti Nota</th>
                <th>Auto-Journal (Debet / Kredit)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem', color: '#94A3B8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle style={{ width: '32px', height: '32px', color: '#CBD5E1' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tidak ada data pengeluaran yang sesuai kriteria filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const c = classifyItem(item);
                  const isCapex = c.type.startsWith('CAPEX');
                  const receiptKey = `ks_receipt_${item.id}`;
                  const hasLocalReceipt = typeof window !== 'undefined' && Boolean(localStorage.getItem(receiptKey));

                  return (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#475569' }}>
                        {item.expense_date || item.date}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284C7', fontSize: '0.75rem' }}>
                        {item.id ? item.id.substring(0, 8).toUpperCase() : 'OPX-REC'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{
                            alignSelf: 'flex-start',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '0.375rem',
                            background: c.bg,
                            color: c.color,
                            border: `1px solid ${c.border}`
                          }}>
                            {c.badge}
                          </span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                            {item.category}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem', color: '#334155', maxWidth: '320px' }}>
                          {item.description || '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.875rem', color: '#0F172A' }}>
                        Rp {(Number(item.amount) || 0).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '0.375rem',
                          background: item.paymentAccountCode === '201' ? '#FEF3C7' : '#F1F5F9',
                          color: item.paymentAccountCode === '201' ? '#92400E' : '#475569',
                          border: `1px solid ${item.paymentAccountCode === '201' ? '#FDE68A' : '#E2E8F0'}`
                        }}>
                          {item.paymentAccountCode === '201' ? 'Hutang / Kredit (201)' : 'Kas / Bank (101)'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            const cached = localStorage.getItem(receiptKey);
                            setSelectedReceipt({
                              item,
                              image: cached || null
                            });
                          }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '0.5rem',
                            background: '#F0F9FF', border: '1px solid #BAE6FD',
                            color: '#0284C7', cursor: 'pointer', transition: 'all 0.15s'
                          }}
                          title="Lihat Nota / Bukti Bayar"
                        >
                          <Eye style={{ width: '14px', height: '14px' }} />
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: '#16A34A', fontWeight: 700 }}>
                            (D) {c.debet}
                          </span>
                          <span style={{ color: '#0284C7', fontWeight: 700 }}>
                            (K) {c.kredit}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Table Pagination (FSD v1.1 Section 3: 10 items/page) */}
        <div style={{
          padding: '0.875rem 1.25rem',
          borderTop: '1.5px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
            Menampilkan <strong style={{ color: '#0F172A' }}>{filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> - <strong style={{ color: '#0F172A' }}>{Math.min(currentPage * itemsPerPage, filteredData.length)}</strong> dari <strong style={{ color: '#0F172A' }}>{filteredData.length}</strong> transaksi (Standar 10 baris/halaman)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                fontSize: '0.75rem', fontWeight: 700,
                background: '#FFFFFF', color: currentPage === 1 ? '#CBD5E1' : '#475569',
                border: '1.5px solid #E2E8F0', cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronsLeft style={{ width: '14px', height: '14px' }} />
              First
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                fontSize: '0.75rem', fontWeight: 700,
                background: '#FFFFFF', color: currentPage === 1 ? '#CBD5E1' : '#475569',
                border: '1.5px solid #E2E8F0', cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft style={{ width: '14px', height: '14px' }} />
              Prev
            </button>

            <span style={{
              padding: '0.4rem 0.875rem', borderRadius: '0.5rem',
              fontSize: '0.75rem', fontWeight: 800,
              background: '#0284C7', color: '#FFFFFF', fontFamily: 'var(--font-mono)'
            }}>
              Halaman {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                fontSize: '0.75rem', fontWeight: 700,
                background: '#FFFFFF', color: currentPage === totalPages ? '#CBD5E1' : '#475569',
                border: '1.5px solid #E2E8F0', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                fontSize: '0.75rem', fontWeight: 700,
                background: '#FFFFFF', color: currentPage === totalPages ? '#CBD5E1' : '#475569',
                border: '1.5px solid #E2E8F0', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Last
              <ChevronsRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: FORM INPUT OPEX & CAPEX (FSD v1.1 Section 2) */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1.5px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#F8FAFC',
              borderRadius: '1.5rem 1.5rem 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '0.625rem',
                  background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FFFFFF', boxShadow: '0 4px 12px rgba(2,132,199,0.3)'
                }}>
                  <ReceiptText style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: '1rem', lineHeight: 1.2 }}>
                    Catat Transaksi OPEX & CAPEX
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                    Validasi 5 Syarat Transaksi & Auto-Posting Jurnal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '0.5rem',
                  background: '#F1F5F9', border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748B'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              {/* Type Switcher */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>
                  PILIH KLASIFIKASI PENGELUARAN *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {[
                    { id: 'OPEX_RUTIN', label: 'OPEX Rutin', desc: 'Beban Operasional 502' },
                    { id: 'OPEX_WASTE_CFD', label: 'Waste CFD', desc: 'Beban Kerugian 504' },
                    { id: 'CAPEX_PERALATAN', label: 'CAPEX Peralatan', desc: 'Aset Tetap 103' },
                    { id: 'CAPEX_PERLENGKAPAN', label: 'CAPEX Perlengkapan', desc: 'Aset Tetap 104' },
                  ].map(t => {
                    const active = formData.opexType === t.id;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => {
                          const cats = categoryOptions[t.id];
                          setFormData(prev => ({
                            ...prev,
                            opexType: t.id,
                            category: cats[0]
                          }));
                        }}
                        style={{
                          padding: '0.625rem 0.5rem',
                          borderRadius: '0.75rem',
                          border: active ? '2px solid #0284C7' : '1.5px solid #E2E8F0',
                          background: active ? '#F0F9FF' : '#FFFFFF',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: active ? '#0284C7' : '#0F172A' }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: active ? '#0369A1' : '#64748B', marginTop: '0.15rem' }}>
                          {t.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 1: Tanggal Transaksi & Kategori Biaya */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    (1) Tanggal Transaksi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      width: '100%', padding: '0.55rem 0.75rem',
                      background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                      borderRadius: '0.625rem', fontSize: '0.8125rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    (2) Kategori Biaya *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%', padding: '0.55rem 0.75rem',
                      background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                      borderRadius: '0.625rem', fontSize: '0.8125rem', cursor: 'pointer'
                    }}
                  >
                    {categoryOptions[formData.opexType]?.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Nominal & Metode Pembayaran */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    (3) Nominal Biaya (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 150000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    style={{
                      width: '100%', padding: '0.55rem 0.75rem',
                      background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                      borderRadius: '0.625rem', fontSize: '0.9375rem',
                      fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284C7'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    (4) Metode Pembayaran *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    style={{
                      width: '100%', padding: '0.55rem 0.75rem',
                      background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                      borderRadius: '0.625rem', fontSize: '0.8125rem', cursor: 'pointer'
                    }}
                  >
                    <option value="CASH">Kas Tunai Toko (101)</option>
                    <option value="TRANSFER">Transfer Bank Operasional (101)</option>
                    <option value="QRIS">QRIS Toko (101)</option>
                    {(formData.opexType === 'CAPEX_PERALATAN') && (
                      <option value="HUTANG">Hutang Vendor / Kredit (201)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Khusus CAPEX: Estimasi Masa Manfaat (Benefit) */}
              {(formData.opexType === 'CAPEX_PERALATAN' || formData.opexType === 'CAPEX_PERLENGKAPAN') && (
                <div style={{
                  padding: '0.875rem 1rem', background: '#F5F3FF',
                  border: '1.5px solid #DDD6FE', borderRadius: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6D28D9' }}>
                      (6) Estimasi Masa Manfaat Aset (Khusus CAPEX) *
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED', fontFamily: 'var(--font-mono)' }}>
                      Depresiasi Garis Lurus: Rp {formData.amount ? Math.round(Number(formData.amount) / (Number(formData.benefitMonths) || 1)).toLocaleString('id-ID') : 0} / bulan
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <select
                      value={formData.benefitMonths}
                      onChange={(e) => setFormData({ ...formData, benefitMonths: Number(e.target.value) })}
                      style={{
                        padding: '0.45rem 0.75rem', background: '#FFFFFF',
                        border: '1.5px solid #DDD6FE', borderRadius: '0.5rem',
                        fontSize: '0.8125rem', fontWeight: 700, color: '#5B21B6'
                      }}
                    >
                      <option value={6}>6 Bulan (Perlengkapan Singkat)</option>
                      <option value={12}>12 Bulan (1 Tahun - Meja/Canopy)</option>
                      <option value={24}>24 Bulan (2 Tahun - Blender/Grinder)</option>
                      <option value={36}>36 Bulan (3 Tahun - Mesin Espresso)</option>
                      <option value={48}>48 Bulan (4 Tahun - Kulkas/Chiller)</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', color: '#6D28D9' }}>
                      *Pencatatan untuk Neraca Keuangan & Depresiasi Aset.
                    </span>
                  </div>
                </div>
              )}

              {/* Rincian / Deskripsi */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  Keterangan / Rincian Pengeluaran
                </label>
                <textarea
                  rows="2"
                  placeholder="Rincian pembayaran, vendor, atau keperluan pengeluaran..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%', padding: '0.55rem 0.75rem',
                    background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                    borderRadius: '0.625rem', fontSize: '0.8125rem', resize: 'vertical'
                  }}
                />
              </div>

              {/* Row 4: (5) Bukti Pembayaran / Upload Nota (FSD v1.1 Rule 5) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  (5) Bukti Pembayaran (Upload Foto Nota / Kwitansi) *
                </label>
                <div style={{
                  border: '2px dashed #CBD5E1', borderRadius: '0.75rem',
                  padding: '1rem', textAlign: 'center', background: '#F8FAFC',
                  position: 'relative'
                }}>
                  {formData.receiptPreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                      <img
                        src={formData.receiptPreview}
                        alt="Bukti Nota"
                        style={{ height: '70px', borderRadius: '0.5rem', objectFit: 'cover', border: '1px solid #E2E8F0' }}
                      />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>{formData.receiptImage || 'Nota Kwitansi'}</div>
                        <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 600 }}>Foto nota siap dilampirkan</span>
                        <div style={{ marginTop: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, receiptPreview: null, receiptImage: null })}
                            style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            Hapus Foto
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud style={{ width: '28px', height: '28px', color: '#0284C7', margin: '0 auto 0.35rem' }} />
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', margin: 0 }}>
                        Pilih foto struk nota belanja atau seret file ke sini
                      </p>
                      <p style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                        Format PNG, JPG, JPEG (Maks. 5 MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          opacity: 0, cursor: 'pointer'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-Journal Preview Box */}
              <div style={{
                padding: '0.75rem 1rem', background: '#F0FDF4',
                border: '1.5px solid #BBF7D0', borderRadius: '0.75rem',
                fontSize: '0.75rem', color: '#15803D', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span>
                  <strong>Aturan Auto-Journal:</strong> Sistem otomatis memposting jurnal berpasangan{' '}
                  {formData.opexType === 'OPEX_RUTIN' && 'Debet 502 (Beban Operasional) → Kredit 101 (Kas/Bank)'}
                  {formData.opexType === 'OPEX_WASTE_CFD' && 'Debet 504 (Beban Waste CFD) → Kredit 102 (Persediaan)'}
                  {formData.opexType === 'CAPEX_PERALATAN' && (formData.paymentMethod === 'HUTANG' ? 'Debet 103 (Aset Tetap Peralatan) → Kredit 201 (Hutang)' : 'Debet 103 (Aset Tetap Peralatan) → Kredit 101 (Kas/Bank)')}
                  {formData.opexType === 'CAPEX_PERLENGKAPAN' && 'Debet 104 (Aset Perlengkapan) → Kredit 101 (Kas/Bank)'}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1.5px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '0.55rem 1.25rem', borderRadius: '0.75rem',
                    fontSize: '0.8125rem', fontWeight: 700,
                    background: '#F1F5F9', color: '#475569',
                    border: '1.5px solid #E2E8F0', cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                    padding: '0.55rem 1.5rem', borderRadius: '0.75rem',
                    fontSize: '0.8125rem', fontWeight: 800,
                    background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                    color: '#FFFFFF', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2,132,199,0.3)'
                  }}
                >
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                  Simpan & Posting Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CAR FREE DAY (CFD) SISA PRODUK & WASTE SETTLEMENT (FSD v1.1 Section 4) */}
      {isCfdWasteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1.5px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#FEF2F2',
              borderRadius: '1.5rem 1.5rem 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '0.625rem',
                  background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FFFFFF', boxShadow: '0 4px 12px rgba(220,38,38,0.3)'
                }}>
                  <Flame style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 900, color: '#991B1B', fontSize: '1rem', lineHeight: 1.2 }}>
                    Alokasi Sisa Produk Car Free Day (CFD)
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#B91C1C', marginTop: '0.15rem' }}>
                    TOTAL HPP BATCH KELUAR = Qty Terjual × BOM Cost + Qty Unsold × BOM Cost
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCfdWasteModalOpen(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '0.5rem',
                  background: '#FFFFFF', border: '1px solid #FECACA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#DC2626'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              {/* Event Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    Tanggal Sesi CFD
                  </label>
                  <input
                    type="date"
                    value={cfdSessionDate}
                    onChange={(e) => setCfdSessionDate(e.target.value)}
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem',
                      background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                      borderRadius: '0.625rem', fontSize: '0.8125rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    Lokasi / Event CFD
                  </label>
                  <input
                    type="text"
                    value={cfdLocation}
                    onChange={(e) => setCfdLocation(e.target.value)}
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem',
                      background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                      borderRadius: '0.625rem', fontSize: '0.8125rem'
                    }}
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>
                  DAFTAR PRODUK BAWAAN CFD & SISA TERBUANG (EDITABLE REAL-TIME)
                </label>
                <div style={{ border: '1.5px solid #E2E8F0', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <table className="custom-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Varian Produk</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Bawa (Awal)</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Terjual</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Sisa / Waste</th>
                        <th style={{ width: '120px', textAlign: 'right' }}>Beban Waste (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cfdItems.map((item, idx) => {
                        const v = variants.find(vr => vr.id === item.variantId);
                        const bomCost = Number(v?.totalHPP || v?.hpp || 3500);
                        const unsold = Number(item.qtyUnsold) || 0;
                        const wasteCost = unsold * bomCost;

                        return (
                          <tr key={idx}>
                            <td>
                              <select
                                value={item.variantId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCfdItems(prev => prev.map((it, i) => i === idx ? { ...it, variantId: val } : it));
                                }}
                                style={{
                                  width: '100%', padding: '0.4rem 0.5rem',
                                  background: '#FFFFFF', border: '1px solid #CBD5E1',
                                  borderRadius: '0.5rem', fontSize: '0.75rem'
                                }}
                              >
                                {variants.map(vr => (
                                  <option key={vr.id} value={vr.id}>
                                    {vr.productName} ({vr.sizeLabel}) — BOM: Rp {Math.round(vr.totalHPP || vr.hpp || 0)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                value={item.qtyBrought}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setCfdItems(prev => prev.map((it, i) => {
                                    if (i !== idx) return it;
                                    const nextSold = Math.min(val, it.qtySold);
                                    return { ...it, qtyBrought: val, qtySold: nextSold, qtyUnsold: val - nextSold };
                                  }));
                                }}
                                style={{ width: '100%', padding: '0.35rem', textAlign: 'center', border: '1px solid #CBD5E1', borderRadius: '0.375rem', fontSize: '0.75rem' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max={item.qtyBrought}
                                value={item.qtySold}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setCfdItems(prev => prev.map((it, i) => {
                                    if (i !== idx) return it;
                                    return { ...it, qtySold: val, qtyUnsold: Math.max(0, it.qtyBrought - val) };
                                  }));
                                }}
                                style={{ width: '100%', padding: '0.35rem', textAlign: 'center', border: '1px solid #CBD5E1', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                value={item.qtyUnsold}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setCfdItems(prev => prev.map((it, i) => i === idx ? { ...it, qtyUnsold: val } : it));
                                }}
                                style={{ width: '100%', padding: '0.35rem', textAlign: 'center', border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 800, color: '#DC2626' }}
                              />
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#DC2626', fontSize: '0.8125rem' }}>
                              Rp {Math.round(wasteCost).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (variants.length > 0) {
                        setCfdItems(prev => [...prev, { variantId: variants[0].id, qtyBrought: 20, qtySold: 18, qtyUnsold: 2 }]);
                      }
                    }}
                    style={{
                      fontSize: '0.75rem', fontWeight: 700, color: '#0284C7',
                      background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                    }}
                  >
                    + Tambah Baris Varian Produk CFD
                  </button>
                </div>
              </div>

              {/* Kalkulasi Ringkasan FSD Section 4 */}
              <div style={{
                padding: '1rem', background: '#FFFBEB',
                border: '1.5px solid #FDE68A', borderRadius: '0.75rem',
                display: 'flex', flexDirection: 'column', gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#92400E' }}>
                  <span>HPP Produk Terjual CFD (→ Debet HPP 501 / Kredit 102):</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: '#16A34A' }}>
                    Rp {Math.round(cfdCalculations.totalTerjualBOM).toLocaleString('id-ID')}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#991B1B', paddingTop: '0.35rem', borderTop: '1px solid #FDE68A' }}>
                  <span><strong>Total Beban Waste CFD (→ Debet 504 / Kredit 102):</strong></span>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#DC2626' }}>
                    Rp {Math.round(cfdCalculations.totalWasteBOM).toLocaleString('id-ID')}
                  </strong>
                </div>

                <div style={{ fontSize: '0.7rem', color: '#B45309', marginTop: '0.2rem' }}>
                  *Sisa produk olahan yang tidak terjual tidak dapat disimpan kembali dan diakui penuh sebagai Beban Kerugian Produk (Waste Expense) periode berjalan.
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1.5px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsCfdWasteModalOpen(false)}
                  style={{
                    padding: '0.55rem 1.25rem', borderRadius: '0.75rem',
                    fontSize: '0.8125rem', fontWeight: 700,
                    background: '#F1F5F9', color: '#475569',
                    border: '1.5px solid #E2E8F0', cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSettleCfdWaste}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                    padding: '0.55rem 1.5rem', borderRadius: '0.75rem',
                    fontSize: '0.8125rem', fontWeight: 800,
                    background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                    color: '#FFFFFF', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(220,38,38,0.3)'
                  }}
                >
                  <Flame style={{ width: '16px', height: '16px' }} />
                  Tutup Sesi & Alokasikan Waste CFD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PREVIEW BUKTI PEMBAYARAN NOTA / STRUK */}
      {selectedReceipt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1.5px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#F8FAFC',
              borderRadius: '1.5rem 1.5rem 0 0'
            }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Image style={{ width: '16px', height: '16px', color: '#0284C7' }} />
                Bukti Pembayaran Transaksi
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{
                  width: '28px', height: '28px', borderRadius: '0.5rem',
                  background: '#F1F5F9', border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748B'
                }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Kategori Transaksi:</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>{selectedReceipt.item.category}</div>
                <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '0.25rem' }}>{selectedReceipt.item.description}</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0284C7', fontFamily: 'var(--font-mono)', marginTop: '0.5rem' }}>
                  Rp {(Number(selectedReceipt.item.amount) || 0).toLocaleString('id-ID')}
                </div>
              </div>

              {selectedReceipt.image ? (
                <div style={{ textAlign: 'center', border: '1px solid #E2E8F0', borderRadius: '0.75rem', overflow: 'hidden', maxHeight: '340px' }}>
                  <img
                    src={selectedReceipt.image}
                    alt="Bukti Kwitansi"
                    style={{ width: '100%', height: 'auto', maxHeight: '340px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div style={{
                  padding: '2.5rem 1rem', textAlign: 'center', background: '#F8FAFC',
                  borderRadius: '0.75rem', border: '1.5px dashed #CBD5E1', color: '#64748B'
                }}>
                  <FileText style={{ width: '36px', height: '36px', color: '#94A3B8', margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0 }}>Bukti Fisik Tercatat di Ledger</p>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                    Transaksi ini telah diautentikasi dan diposting ke Jurnal Umum Akuntansi.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: '0.625rem',
                    fontSize: '0.8125rem', fontWeight: 700,
                    background: '#0284C7', color: '#FFFFFF', border: 'none', cursor: 'pointer'
                  }}
                >
                  Tutup Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
