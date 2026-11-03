import React, { useState, useMemo, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import {
  BookOpenCheck,
  BookOpen,
  Scale,
  TrendingUp,
  Landmark,
  PlusCircle,
  Receipt,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  DollarSign,
  Layers,
  PieChart,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export const JournalModule = ({ onOpenOpex, onOpenStockIn, initialSubTab = 'journal' }) => {
  const {
    journal,
    coa,
    activeTab,
    setActiveTab,
    calculateLedger,
    calculateTrialBalance,
    calculateBalanceSheet,
    calculateIncomeStatement,
    showToast
  } = useERP();

  // Active Sub-Tab state: 'journal' | 'ledger' | 'trial-balance' | 'income-statement' | 'balance-sheet'
  const validTabs = ['journal', 'ledger', 'trial-balance', 'income-statement', 'balance-sheet'];
  const currentSubTab = validTabs.includes(activeTab) ? activeTab : (validTabs.includes(initialSubTab) ? initialSubTab : 'journal');

  const handleSubTabChange = (tabId) => {
    if (setActiveTab) {
      setActiveTab(tabId);
    }
  };

  // -------------------------------------------------------------
  // TAB 1: JURNAL UMUM (GENERAL JOURNAL) STATE
  // -------------------------------------------------------------
  const [jSearchQuery, setJSearchQuery] = useState('');
  const [jPeriodFilter, setJPeriodFilter] = useState('ALL');
  const [jStartDate, setJStartDate] = useState('');
  const [jEndDate, setJEndDate] = useState('');
  const [jCurrentPage, setJCurrentPage] = useState(1);
  const itemsPerPage = 10;

  let totalDebits = 0;
  let totalCredits = 0;
  journal.forEach(entry => {
    (entry.items || []).forEach(item => {
      totalDebits += Number(item.debit) || 0;
      totalCredits += Number(item.credit) || 0;
    });
  });
  const isJournalBalanced = totalDebits === totalCredits;

  const autoJournalRules = [
    { event: 'Penerimaan Hasil Sales / PO', debet: '101 - Kas & Bank', kredit: '401 - Pendapatan Penjualan', note: 'Kas masuk hasil penjualan tunai/QRIS/transfer' },
    { event: 'Pengakuan HPP saat Transaksi', debet: '501 - Beban Pokok Penjualan (HPP)', kredit: '102 - Persediaan Bahan Baku', note: 'Deduksi otomatis persediaan sesuai formula BOM' },
    { event: 'OPEX Pengeluaran Rutin', debet: '502 - Beban Operasional Rutin', kredit: '101 - Kas & Bank', note: 'Beban listrik, kebersihan, air, sewa tempat CFD' },
    { event: 'OPEX Waste CFD (Produk Sisa/Rusak)', debet: '504 - Beban Waste CFD', kredit: '102 - Persediaan Bahan Baku', note: 'Kerugian produk CFD olahan tidak laku / rusak' },
    { event: 'CAPEX Aset Peralatan', debet: '103 - Aset Tetap Peralatan', kredit: '101 - Kas / 201 - Hutang', note: 'Mesin espresso, grinder, blender, coolbox' },
    { event: 'CAPEX Perlengkapan Toko', debet: '104 - Aset Perlengkapan Toko', kredit: '101 - Kas & Bank', note: 'Meja lipat CFD, banner promosi, tenda canopy' },
    { event: 'Pembelian Bahan Baku Tunai', debet: '102 - Persediaan Bahan Baku', kredit: '101 - Kas & Bank', note: 'Restok bahan baku tunai dari Kas toko' },
    { event: 'Pembelian Bahan Kredit Vendor', debet: '102 - Persediaan Bahan Baku', kredit: '201 - Hutang Usaha Supplier', note: 'Kewajiban tagihan tempo dari vendor supplier' }
  ];

  const filteredJournal = useMemo(() => {
    return journal.filter(entry => {
      const q = jSearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (entry.ref || '').toLowerCase().includes(q) ||
        (entry.description || '').toLowerCase().includes(q) ||
        (entry.date || '').toLowerCase().includes(q) ||
        (entry.items || []).some(it =>
          (it.accountCode || '').toLowerCase().includes(q) ||
          (it.accountName || '').toLowerCase().includes(q)
        );

      if (!matchSearch) return false;

      const entryDate = new Date(entry.date);
      const now = new Date();
      if (jPeriodFilter === 'THIS_MONTH') {
        if (entryDate.getMonth() !== now.getMonth() || entryDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (jPeriodFilter === 'LAST_MONTH') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        if (entryDate.getMonth() !== lastMonth || entryDate.getFullYear() !== lastYear) {
          return false;
        }
      } else if (jPeriodFilter === 'THIS_YEAR') {
        if (entryDate.getFullYear() !== now.getFullYear()) return false;
      } else if (jPeriodFilter === 'CUSTOM') {
        if (jStartDate && entry.date < jStartDate) return false;
        if (jEndDate && entry.date > jEndDate) return false;
      }

      return true;
    });
  }, [journal, jSearchQuery, jPeriodFilter, jStartDate, jEndDate]);

  const jTotalPages = Math.max(1, Math.ceil(filteredJournal.length / itemsPerPage));
  const paginatedJournal = filteredJournal.slice((jCurrentPage - 1) * itemsPerPage, jCurrentPage * itemsPerPage);

  useEffect(() => {
    setJCurrentPage(1);
  }, [jSearchQuery, jPeriodFilter, jStartDate, jEndDate]);

  // -------------------------------------------------------------
  // TAB 2: BUKU BESAR (GENERAL LEDGER) STATE
  // -------------------------------------------------------------
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState('101');
  const [lSearchQuery, setLSearchQuery] = useState('');
  const [lPeriodFilter, setLPeriodFilter] = useState('ALL');
  const [lStartDate, setLStartDate] = useState('');
  const [lEndDate, setLEndDate] = useState('');
  const [lCurrentPage, setLCurrentPage] = useState(1);

  const ledgerData = useMemo(() => {
    if (!calculateLedger) {
      return { account: {}, entries: [], totalDebits: 0, totalCredits: 0, endingBalance: 0 };
    }
    return calculateLedger(selectedLedgerAccount, {
      periodFilter: lPeriodFilter,
      startDate: lStartDate,
      endDate: lEndDate,
      searchQuery: lSearchQuery
    });
  }, [calculateLedger, selectedLedgerAccount, lPeriodFilter, lStartDate, lEndDate, lSearchQuery, journal, coa]);

  const lTotalPages = Math.max(1, Math.ceil((ledgerData.entries || []).length / itemsPerPage));
  const paginatedLedgerEntries = (ledgerData.entries || []).slice((lCurrentPage - 1) * itemsPerPage, lCurrentPage * itemsPerPage);

  useEffect(() => {
    setLCurrentPage(1);
  }, [selectedLedgerAccount, lSearchQuery, lPeriodFilter, lStartDate, lEndDate]);

  // -------------------------------------------------------------
  // TAB 3: NERACA SALDO (TRIAL BALANCE) STATE
  // -------------------------------------------------------------
  const [tbPeriodFilter, setTbPeriodFilter] = useState('ALL');
  const [tbStartDate, setTbStartDate] = useState('');
  const [tbEndDate, setTbEndDate] = useState('');
  const [tbSearchQuery, setTbSearchQuery] = useState('');

  const trialBalanceData = useMemo(() => {
    if (!calculateTrialBalance) {
      return { rows: [], grandDebitMutations: 0, grandCreditMutations: 0, grandEndingDebit: 0, grandEndingCredit: 0, isBalanced: true, difference: 0 };
    }
    return calculateTrialBalance({
      periodFilter: tbPeriodFilter,
      startDate: tbStartDate,
      endDate: tbEndDate
    });
  }, [calculateTrialBalance, tbPeriodFilter, tbStartDate, tbEndDate, journal, coa]);

  const filteredTbRows = useMemo(() => {
    const q = (tbSearchQuery || '').toLowerCase().trim();
    if (!q) return trialBalanceData.rows || [];
    return (trialBalanceData.rows || []).filter(r =>
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      (r.classification || '').toLowerCase().includes(q)
    );
  }, [trialBalanceData.rows, tbSearchQuery]);

  // -------------------------------------------------------------
  // TAB 4: LAPORAN LABA RUGI (INCOME STATEMENT) STATE
  // -------------------------------------------------------------
  const [isPeriodFilter, setIsPeriodFilter] = useState('THIS_MONTH');
  const [isStartDate, setIsStartDate] = useState('');
  const [isEndDate, setIsEndDate] = useState('');

  const incomeStatementData = useMemo(() => {
    if (!calculateIncomeStatement) {
      return { revenue: 0, hpp: 0, grossProfit: 0, opexRutin: 0, opexWaste: 0, opexLain: 0, totalOpex: 0, netProfit: 0, grossMarginPercent: '0', netMarginPercent: '0', isProfit: true };
    }
    return calculateIncomeStatement({
      periodFilter: isPeriodFilter,
      startDate: isStartDate,
      endDate: isEndDate
    });
  }, [calculateIncomeStatement, isPeriodFilter, isStartDate, isEndDate, journal]);

  // -------------------------------------------------------------
  // TAB 5: LAPORAN NERACA (BALANCE SHEET) STATE
  // -------------------------------------------------------------
  const [bsAsOfDate, setBsAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const balanceSheetData = useMemo(() => {
    if (!calculateBalanceSheet) {
      return { kas: 0, persediaan: 0, asetLancar: 0, peralatan: 0, perlengkapan: 0, asetTetap: 0, totalAset: 0, hutang: 0, totalKewajiban: 0, modal: 0, currentNetProfit: 0, totalEkuitas: 0, totalPasiva: 0, difference: 0, isBalanced: true };
    }
    return calculateBalanceSheet(bsAsOfDate);
  }, [calculateBalanceSheet, bsAsOfDate, journal]);

  // -------------------------------------------------------------
  // EXPORT CSV UTILITIES
  // -------------------------------------------------------------
  const exportJournalCSV = () => {
    const rows = [
      ['Tanggal', 'No Ref', 'Keterangan', 'Kode Akun', 'Nama Akun', 'Debet (Rp)', 'Kredit (Rp)']
    ];
    filteredJournal.forEach(entry => {
      (entry.items || []).forEach(it => {
        rows.push([
          entry.date,
          entry.ref,
          `"${(entry.description || '').replace(/"/g, '""')}"`,
          it.accountCode,
          `"${(it.accountName || '').replace(/"/g, '""')}"`,
          it.debit || 0,
          it.credit || 0
        ]);
      });
    });
    downloadCSV(rows, `Jurnal_Umum_Kopi_Sesuk_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportLedgerCSV = () => {
    const rows = [
      [`Buku Besar Akun: ${ledgerData.account?.code} - ${ledgerData.account?.name}`],
      [`Posisi Normal: ${ledgerData.account?.normalPosition || 'DEBET'}`],
      [],
      ['Tanggal', 'No Ref', 'Keterangan Transaksi', 'Debet (Rp)', 'Kredit (Rp)', 'Saldo Berjalan (Rp)']
    ];
    (ledgerData.entries || []).forEach(e => {
      rows.push([
        e.date,
        e.ref,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        e.debit,
        e.credit,
        e.balance
      ]);
    });
    rows.push([]);
    rows.push(['TOTAL MUTASI DEBET', '', '', ledgerData.totalDebits, '', '']);
    rows.push(['TOTAL MUTASI KREDIT', '', '', '', ledgerData.totalCredits, '']);
    rows.push(['SALDO AKHIR BERJALAN', '', '', '', '', ledgerData.endingBalance]);
    downloadCSV(rows, `Buku_Besar_${ledgerData.account?.code}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportTrialBalanceCSV = () => {
    const rows = [
      ['Kode Akun', 'Nama Akun', 'Klasifikasi', 'Posisi Normal', 'Total Debet (Rp)', 'Total Kredit (Rp)', 'Saldo Debet (Rp)', 'Saldo Kredit (Rp)']
    ];
    (trialBalanceData.rows || []).forEach(r => {
      rows.push([
        r.code,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.classification || '').replace(/"/g, '""')}"`,
        r.normalPosition,
        r.totalDebits,
        r.totalCredits,
        r.saldoDebet,
        r.saldoKredit
      ]);
    });
    rows.push([]);
    rows.push(['TOTAL', '', '', '', trialBalanceData.grandDebitMutations, trialBalanceData.grandCreditMutations, trialBalanceData.grandEndingDebit, trialBalanceData.grandEndingCredit]);
    downloadCSV(rows, `Neraca_Saldo_Trial_Balance_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportIncomeStatementCSV = () => {
    const rows = [
      ['LAPORAN LABA RUGI (INCOME STATEMENT) - KOPI SESUK ERP v2.0'],
      ['Komponen Keuangan', 'Jumlah (Rp)'],
      ['1. PENDAPATAN PENJUALAN (SALES - AKUN 401)', incomeStatementData.revenue],
      ['2. BEBAN POKOK PENJUALAN (HPP BOM - AKUN 501)', -incomeStatementData.hpp],
      ['3. LABA KOTOR (GROSS PROFIT)', incomeStatementData.grossProfit],
      ['   - Margin Laba Kotor (%)', `${incomeStatementData.grossMarginPercent}%`],
      ['4. BEBAN OPERASIONAL (OPEX RUTIN - AKUN 502)', -incomeStatementData.opexRutin],
      ['5. BEBAN WASTE / KERUGIAN CFD (AKUN 504)', -incomeStatementData.opexWaste],
      ['   TOTAL BEBAN OPERASIONAL', -incomeStatementData.totalOpex],
      ['6. LABA BERSIH BERJALAN (NET PROFIT)', incomeStatementData.netProfit],
      ['   - Margin Laba Bersih (%)', `${incomeStatementData.netMarginPercent}%`]
    ];
    downloadCSV(rows, `Laporan_Laba_Rugi_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportBalanceSheetCSV = () => {
    const rows = [
      ['LAPORAN NERACA KEUANGAN (BALANCE SHEET) - KOPI SESUK ERP v2.0'],
      [`Posisi Per Tanggal: ${bsAsOfDate}`],
      [],
      ['SISI AKTIVA (ASET)', 'Jumlah (Rp)', '', 'SISI PASIVA (KEWAJIBAN & EKUITAS)', 'Jumlah (Rp)'],
      ['Aset Lancar:', '', '', 'Kewajiban (Liabilitas):', ''],
      ['  101 Kas & Bank (Kas Store / QRIS)', balanceSheetData.kas, '', '  201 Hutang Usaha / Vendor Supplier', balanceSheetData.hutang],
      ['  102 Persediaan Bahan Baku & Stok', balanceSheetData.persediaan, '', 'Total Kewajiban', balanceSheetData.totalKewajiban],
      ['Total Aset Lancar', balanceSheetData.asetLancar, '', '', ''],
      ['', '', '', 'Ekuitas:', ''],
      ['Aset Tetap (CAPEX):', '', '', '  301 Modal Toko / Pemilik', balanceSheetData.modal],
      ['  103 Aset Tetap Peralatan', balanceSheetData.peralatan, '', '  Laba Bersih Periode Berjalan', balanceSheetData.currentNetProfit],
      ['  104 Aset Perlengkapan Toko', balanceSheetData.perlengkapan, '', 'Total Ekuitas', balanceSheetData.totalEkuitas],
      ['Total Aset Tetap', balanceSheetData.asetTetap, '', '', ''],
      [],
      ['TOTAL AKTIVA (ASET)', balanceSheetData.totalAset, '', 'TOTAL PASIVA (KEWAJIBAN + EKUITAS)', balanceSheetData.totalPasiva],
      ['STATUS KESEIMBANGAN', balanceSheetData.isBalanced ? 'SEIMBANG (BALANCED)' : 'SELISIH', '', 'SELISIH NERACA', balanceSheetData.difference]
    ];
    downloadCSV(rows, `Laporan_Neraca_${bsAsOfDate}.csv`);
  };

  const downloadCSV = (rows, filename) => {
    const csvContent = rows.map(e => Array.isArray(e) ? e.join(',') : e).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast(`File ${filename} berhasil diunduh!`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Top Banner Header: Modul Utama Akuntansi & Keuangan (FSD v2.0 Section 1 & 3) */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0369A1 100%)',
        borderRadius: '1.25rem',
        padding: '1.5rem 2rem',
        color: '#FFFFFF',
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.4rem' }}>
            <span style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38BDF8',
              letterSpacing: '0.04em'
            }}>
              FSD v2.0 Baseline Major Update
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
              November 2026 • Double-Entry Bookkeeping
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <BookOpenCheck style={{ width: '26px', height: '26px', color: '#38BDF8' }} />
            Modul Akuntansi & Buku Besar Terpusat
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#CBD5E1', margin: '0.35rem 0 0 0', maxWidth: '42rem' }}>
            Pusat integrasi data keuangan dari seluruh aktivitas operasional (PO, Sales CFD, Restock Bahan, OPEX, CAPEX, dan Waste) menghasilkan Laporan Keuangan Otomatis.
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            padding: '0.6rem 1rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '0.75rem',
            backdropFilter: 'blur(8px)',
            textAlign: 'right'
          }}>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Status Double-Entry</span>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: 900,
              color: isJournalBalanced ? '#4ADE80' : '#F87171',
              fontFamily: 'var(--font-mono)'
            }}>
              {isJournalBalanced ? 'BALANCED (SEIMBANG) ✓' : 'UNBALANCED !'}
            </span>
          </div>

          <div style={{
            padding: '0.6rem 1rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '0.75rem',
            backdropFilter: 'blur(8px)',
            textAlign: 'right'
          }}>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Total Jurnal Umum</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
              {journal.length} Entri ({filteredJournal.length} Terfilter)
            </span>
          </div>
        </div>
      </div>

      {/* SUB-MENU NAVIGATION PILLS (FSD v2.0 Section 3: 5 Mandiri Sub-Menus) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem',
        background: '#FFFFFF',
        borderRadius: '1rem',
        border: '1.5px solid #E2E8F0',
        overflowX: 'auto',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        {[
          { id: 'journal', label: 'Jurnal Umum (General Journal)', icon: BookOpenCheck, badge: `${journal.length}` },
          { id: 'ledger', label: 'Buku Besar (General Ledger)', icon: BookOpen, badge: `${coa.length} Akun` },
          { id: 'trial-balance', label: 'Neraca Saldo (Trial Balance)', icon: Scale, badge: trialBalanceData.isBalanced ? '✓ Seimbang' : '! Selisih' },
          { id: 'income-statement', label: 'Laba Rugi (Income Statement)', icon: TrendingUp, badge: incomeStatementData.isProfit ? 'Profit' : 'Defisit' },
          { id: 'balance-sheet', label: 'Laporan Neraca (Balance Sheet)', icon: Landmark, badge: balanceSheetData.isBalanced ? 'Aktiva = Pasiva' : 'Cek' }
        ].map(tab => {
          const isActive = currentSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.125rem',
                borderRadius: '0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                background: isActive ? 'linear-gradient(135deg, #0284C7, #0369A1)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#475569',
                border: isActive ? '1.5px solid transparent' : '1.5px solid transparent',
                boxShadow: isActive ? '0 3px 10px rgba(2, 132, 199, 0.3)' : 'none'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.color = '#0284C7';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <Icon style={{ width: '16px', height: '16px' }} />
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px',
                background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                color: isActive ? '#FFFFFF' : '#64748B',
                fontFamily: 'var(--font-mono)'
              }}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-MENU: JURNAL UMUM (GENERAL JOURNAL)                                 */}
      {/* ========================================================================= */}
      {currentSubTab === 'journal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Action Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: '1.125rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <BookOpenCheck style={{ width: '20px', height: '20px', color: '#0284C7' }} />
                Log Kronologis Jurnal Umum (*General Journal*)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Pencatatan Berpasangan Otomatis Seluruh Transaksi Penjualan, Bahan, OPEX, CAPEX & Waste
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={onOpenOpex}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: '#F0F9FF', color: '#0284C7',
                  border: '1.5px solid #BAE6FD', cursor: 'pointer'
                }}
              >
                <TrendingUp style={{ width: '13px', height: '13px' }} />
                Catat OPEX
              </button>
              <button
                onClick={onOpenStockIn}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: '#F0FDF4', color: '#16A34A',
                  border: '1.5px solid #BBF7D0', cursor: 'pointer'
                }}
              >
                <PlusCircle style={{ width: '13px', height: '13px' }} />
                Jurnal Stok
              </button>
              <button
                onClick={exportJournalCSV}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: '#FFFFFF', color: '#475569',
                  border: '1.5px solid #CBD5E1', cursor: 'pointer'
                }}
              >
                <Download style={{ width: '13px', height: '13px' }} />
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: '#FFFFFF', color: '#475569',
                  border: '1.5px solid #CBD5E1', cursor: 'pointer'
                }}
              >
                <Printer style={{ width: '13px', height: '13px' }} />
                Cetak
              </button>
            </div>
          </div>

          {/* Auto-Journal Posting Rules (FSD v2.0 Section 4) */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', margin: '0 0 0.75rem 0' }}>
              <Receipt style={{ width: '16px', height: '16px', color: '#0284C7' }} />
              Aturan Auto-Posting Jurnal Berpasangan (Double-Entry Engine)
            </h4>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Peristiwa Bisnis</th>
                    <th>Akun Debet</th>
                    <th>Akun Kredit</th>
                    <th>Keterangan Akuntansi</th>
                  </tr>
                </thead>
                <tbody>
                  {autoJournalRules.map((rule, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.78rem' }}>{rule.event}</td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16A34A', fontSize: '0.78rem' }}>{rule.debet}</span></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284C7', fontSize: '0.78rem' }}>{rule.kredit}</span></td>
                      <td style={{ fontSize: '0.78rem', color: '#64748B' }}>{rule.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Standard Chart of Accounts (COA) Grid (FSD v2.0 Section 2) */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.875rem', margin: 0 }}>
                  Chart of Accounts (COA) / Daftar Akun Terpusat (FSD v2.0)
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
                  Klik akun untuk langsung membuka Buku Besar (General Ledger) akun terkait
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7' }}>
                {coa.length} Akun Standar
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.625rem' }}>
              {coa.map(account => (
                <div
                  key={account.code}
                  onClick={() => {
                    setSelectedLedgerAccount(account.code);
                    handleSubTabChange('ledger');
                  }}
                  style={{
                    padding: '0.75rem',
                    background: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#0284C7';
                    e.currentTarget.style.background = '#F0F9FF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.background = '#F8FAFC';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 900, color: '#0284C7' }}>
                      {account.code}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '0.375rem',
                      background: (account.normalPosition || 'DEBET') === 'DEBET' ? '#DCFCE7' : '#EFF6FF',
                      color: (account.normalPosition || 'DEBET') === 'DEBET' ? '#15803D' : '#1D4ED8'
                    }}>
                      {account.normalPosition || 'DEBET'}
                    </span>
                  </div>
                  <h5 style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.78rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {account.name}
                  </h5>
                  <p style={{ fontSize: '0.68rem', color: '#64748B', margin: '0.2rem 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {account.classification || account.type}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Search & Filter Bar (FSD v2.0 Section 7: UI Standardisasi) */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
              <div style={{ position: 'relative', width: '320px', minWidth: '240px' }}>
                <Search style={{ width: '14px', height: '14px', position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Cari No. Ref, keterangan, nama/kode akun..."
                  value={jSearchQuery}
                  onChange={(e) => setJSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                    borderRadius: '0.625rem', fontSize: '0.8125rem', outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0284C7'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <select
                value={jPeriodFilter}
                onChange={(e) => setJPeriodFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.875rem', background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0', borderRadius: '0.625rem',
                  fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', cursor: 'pointer'
                }}
              >
                <option value="ALL">Semua Periode</option>
                <option value="THIS_MONTH">Bulan Ini</option>
                <option value="LAST_MONTH">Bulan Lalu</option>
                <option value="THIS_YEAR">Tahun Ini</option>
                <option value="CUSTOM">Rentang Tanggal Kustom...</option>
              </select>
            </div>

            {jPeriodFilter === 'CUSTOM' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.875rem', background: '#F0F9FF', borderRadius: '0.625rem', border: '1px solid #BAE6FD', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1' }}>Rentang Tanggal Jurnal:</span>
                <input
                  type="date"
                  value={jStartDate}
                  onChange={(e) => setJStartDate(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '0.5rem', fontSize: '0.75rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>s/d</span>
                <input
                  type="date"
                  value={jEndDate}
                  onChange={(e) => setJEndDate(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '0.5rem', fontSize: '0.75rem' }}
                />
                {(jStartDate || jEndDate) && (
                  <button
                    onClick={() => { setJStartDate(''); setJEndDate(''); }}
                    style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>

          {/* General Journal Table (FSD v2.0 Section 7: 10 items/page) */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h4 style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.875rem', margin: 0 }}>
                Daftar Entri Jurnal Umum (General Journal Ledger)
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#64748B' }}>Total Debet: <strong style={{ color: '#16A34A' }}>Rp {totalDebits.toLocaleString('id-ID')}</strong></span>
                <span style={{ color: '#64748B' }}>Total Kredit: <strong style={{ color: '#0284C7' }}>Rp {totalCredits.toLocaleString('id-ID')}</strong></span>
                <span style={{
                  padding: '0.2rem 0.625rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800,
                  background: isJournalBalanced ? '#DCFCE7' : '#FEE2E2',
                  color: isJournalBalanced ? '#15803D' : '#DC2626',
                  border: `1px solid ${isJournalBalanced ? '#86EFAC' : '#FCA5A5'}`
                }}>
                  {isJournalBalanced ? 'BALANCED ✓' : 'UNBALANCED !'}
                </span>
              </div>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>No. Ref</th>
                    <th>Keterangan Transaksi</th>
                    <th>Kode Akun</th>
                    <th>Nama Akun</th>
                    <th style={{ textAlign: 'right' }}>Debet (Rp)</th>
                    <th style={{ textAlign: 'right' }}>Kredit (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedJournal.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                        Tidak ada catatan jurnal yang sesuai kriteria pencarian/filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedJournal.map((entry) => (
                      <React.Fragment key={entry.id}>
                        {entry.items.map((item, idx) => (
                          <tr key={`${entry.id}-${idx}`} style={{ borderTop: idx === 0 ? '1.5px solid #F1F5F9' : 'none' }}>
                            {idx === 0 && (
                              <>
                                <td rowSpan={entry.items.length} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748B', verticalAlign: 'top', paddingTop: '1rem' }}>
                                  {entry.date}
                                </td>
                                <td rowSpan={entry.items.length} style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284C7', fontSize: '0.8rem', verticalAlign: 'top', paddingTop: '1rem' }}>
                                  {entry.ref}
                                </td>
                                <td rowSpan={entry.items.length} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A', verticalAlign: 'top', paddingTop: '1rem', maxWidth: '240px' }}>
                                  {entry.description}
                                </td>
                              </>
                            )}
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                              <span
                                onClick={() => {
                                  setSelectedLedgerAccount(item.accountCode);
                                  handleSubTabChange('ledger');
                                }}
                                style={{ cursor: 'pointer', color: '#0284C7', textDecoration: 'underline' }}
                                title="Buka Buku Besar Akun Ini"
                              >
                                {item.accountCode}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#475569' }}>{item.accountName}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16A34A', fontSize: '0.8rem' }}>
                              {item.debit > 0 ? `Rp ${item.debit.toLocaleString('id-ID')}` : '—'}
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284C7', fontSize: '0.8rem' }}>
                              {item.credit > 0 ? `Rp ${item.credit.toLocaleString('id-ID')}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Standard Pagination (Tepat 10 items/page) */}
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
                Menampilkan <strong style={{ color: '#0F172A' }}>{filteredJournal.length > 0 ? (jCurrentPage - 1) * itemsPerPage + 1 : 0}</strong> - <strong style={{ color: '#0F172A' }}>{Math.min(jCurrentPage * itemsPerPage, filteredJournal.length)}</strong> dari <strong style={{ color: '#0F172A' }}>{filteredJournal.length}</strong> entri jurnal (Standar 10 baris/halaman)
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  onClick={() => setJCurrentPage(1)}
                  disabled={jCurrentPage === 1}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: '#FFFFFF', color: jCurrentPage === 1 ? '#CBD5E1' : '#475569',
                    border: '1.5px solid #E2E8F0', cursor: jCurrentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronsLeft style={{ width: '14px', height: '14px' }} />
                  First
                </button>
                <button
                  onClick={() => setJCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={jCurrentPage === 1}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: '#FFFFFF', color: jCurrentPage === 1 ? '#CBD5E1' : '#475569',
                    border: '1.5px solid #E2E8F0', cursor: jCurrentPage === 1 ? 'not-allowed' : 'pointer'
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
                  {jCurrentPage} / {jTotalPages}
                </span>
                <button
                  onClick={() => setJCurrentPage(prev => Math.min(jTotalPages, prev + 1))}
                  disabled={jCurrentPage === jTotalPages}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: '#FFFFFF', color: jCurrentPage === jTotalPages ? '#CBD5E1' : '#475569',
                    border: '1.5px solid #E2E8F0', cursor: jCurrentPage === jTotalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                  <ChevronRight style={{ width: '14px', height: '14px' }} />
                </button>
                <button
                  onClick={() => setJCurrentPage(jTotalPages)}
                  disabled={jCurrentPage === jTotalPages}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: '#FFFFFF', color: jCurrentPage === jTotalPages ? '#CBD5E1' : '#475569',
                    border: '1.5px solid #E2E8F0', cursor: jCurrentPage === jTotalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Last
                  <ChevronsRight style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-MENU: BUKU BESAR (GENERAL LEDGER)                                    */}
      {/* ========================================================================= */}
      {currentSubTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Account Selector & Header */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '1.125rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <BookOpen style={{ width: '20px', height: '20px', color: '#0284C7' }} />
                  Rekapitulasi Buku Besar per-Akun (General Ledger)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                  Mutasi dan Saldo Berjalan (*Running Balance*) Berdasarkan Klasifikasi Akun Terpusat
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={exportLedgerCSV}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: '#FFFFFF', color: '#475569',
                    border: '1.5px solid #CBD5E1', cursor: 'pointer'
                  }}
                >
                  <Download style={{ width: '13px', height: '13px' }} />
                  Export CSV Akun Ini
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: '#FFFFFF', color: '#475569',
                    border: '1.5px solid #CBD5E1', cursor: 'pointer'
                  }}
                >
                  <Printer style={{ width: '13px', height: '13px' }} />
                  Cetak
                </button>
              </div>
            </div>

            {/* Quick Account Pill Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                Pilih Akun:
              </span>
              {coa.map(acct => {
                const isSelected = selectedLedgerAccount === acct.code;
                return (
                  <button
                    key={acct.code}
                    onClick={() => setSelectedLedgerAccount(acct.code)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: isSelected ? '#0284C7' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      border: isSelected ? '1.5px solid #0284C7' : '1.5px solid #E2E8F0',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {acct.code} - {acct.name.split('(')[0].trim()}
                  </button>
                );
              })}
            </div>

            {/* Selected Account Overview Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              padding: '1.25rem',
              background: '#F8FAFC',
              borderRadius: '0.875rem',
              border: '1.5px solid #E2E8F0'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Akun & Klasifikasi</span>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', margin: '0.25rem 0 0 0' }}>
                  {ledgerData.account?.code} — {ledgerData.account?.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 800,
                    padding: '0.15rem 0.5rem', borderRadius: '0.375rem',
                    background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE'
                  }}>
                    {ledgerData.account?.classification || ledgerData.account?.type}
                  </span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 800,
                    padding: '0.15rem 0.5rem', borderRadius: '0.375rem',
                    background: ledgerData.isDebetNormal ? '#DCFCE7' : '#FEF3C7',
                    color: ledgerData.isDebetNormal ? '#15803D' : '#B45309',
                    border: `1px solid ${ledgerData.isDebetNormal ? '#86EFAC' : '#FDE68A'}`
                  }}>
                    Normal: {ledgerData.account?.normalPosition || 'DEBET'}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Sumber Transaksi Utama</span>
                <p style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, margin: '0.25rem 0 0 0' }}>
                  {ledgerData.account?.source || ledgerData.account?.desc || 'Transaksi operasional ERP Kopi Sesuk'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Mutasi Debet & Kredit</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    (D) Rp {ledgerData.totalDebits.toLocaleString('id-ID')}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#0284C7', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    (K) Rp {ledgerData.totalCredits.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#FFFFFF', padding: '0.875rem 1rem',
                borderRadius: '0.75rem', border: '2px solid #BAE6FD',
                display: 'flex', flexDirection: 'column', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '0.7rem', color: '#0369A1', fontWeight: 800, textTransform: 'uppercase' }}>
                  Saldo Akhir Akun
                </span>
                <span style={{
                  fontSize: '1.25rem', fontWeight: 900,
                  color: ledgerData.endingBalance >= 0 ? '#0284C7' : '#DC2626',
                  fontFamily: 'var(--font-mono)', marginTop: '0.2rem'
                }}>
                  Rp {ledgerData.endingBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Search & Period Filter for Ledger */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
              <div style={{ position: 'relative', width: '320px', minWidth: '240px' }}>
                <Search style={{ width: '14px', height: '14px', position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Cari transaksi pada akun ini..."
                  value={lSearchQuery}
                  onChange={(e) => setLSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                    borderRadius: '0.625rem', fontSize: '0.8125rem', outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0284C7'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <select
                value={lPeriodFilter}
                onChange={(e) => setLPeriodFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.875rem', background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0', borderRadius: '0.625rem',
                  fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', cursor: 'pointer'
                }}
              >
                <option value="ALL">Semua Periode</option>
                <option value="THIS_MONTH">Bulan Ini</option>
                <option value="LAST_MONTH">Bulan Lalu</option>
                <option value="THIS_YEAR">Tahun Ini</option>
                <option value="CUSTOM">Rentang Tanggal Kustom...</option>
              </select>
            </div>

            {lPeriodFilter === 'CUSTOM' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.875rem', background: '#F0F9FF', borderRadius: '0.625rem', border: '1px solid #BAE6FD', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1' }}>Rentang Tanggal Buku Besar:</span>
                <input
                  type="date"
                  value={lStartDate}
                  onChange={(e) => setLStartDate(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '0.5rem', fontSize: '0.75rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>s/d</span>
                <input
                  type="date"
                  value={lEndDate}
                  onChange={(e) => setLEndDate(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '0.5rem', fontSize: '0.75rem' }}
                />
                {(lStartDate || lEndDate) && (
                  <button
                    onClick={() => { setLStartDate(''); setLEndDate(''); }}
                    style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Ledger Table (FSD v2.0 Section 7: 10 items/page) */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
              <h4 style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.875rem', margin: 0 }}>
                Mutasi Buku Besar Akun {ledgerData.account?.code} ({ledgerData.account?.name})
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                {ledgerData.entries?.length || 0} Mutasi Tercatat
              </span>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>No. Ref</th>
                    <th>Keterangan Transaksi</th>
                    <th style={{ textAlign: 'right' }}>Debet (Rp)</th>
                    <th style={{ textAlign: 'right' }}>Kredit (Rp)</th>
                    <th style={{ textAlign: 'right' }}>Saldo Berjalan (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLedgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                        Tidak ada transaksi pada akun ini untuk periode yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    paginatedLedgerEntries.map((row, idx) => (
                      <tr key={row.id || idx}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748B' }}>
                          {row.date}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284C7', fontSize: '0.8rem' }}>
                          {row.ref}
                        </td>
                        <td style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>
                          {row.description}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16A34A', fontSize: '0.8rem' }}>
                          {row.debit > 0 ? `Rp ${row.debit.toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284C7', fontSize: '0.8rem' }}>
                          {row.credit > 0 ? `Rp ${row.credit.toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 900,
                          color: row.balance >= 0 ? '#0F172A' : '#DC2626',
                          fontSize: '0.8125rem'
                        }}>
                          Rp {row.balance.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Standard Pagination (10 rows/page) */}
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
                Menampilkan <strong style={{ color: '#0F172A' }}>{(ledgerData.entries || []).length > 0 ? (lCurrentPage - 1) * itemsPerPage + 1 : 0}</strong> - <strong style={{ color: '#0F172A' }}>{Math.min(lCurrentPage * itemsPerPage, (ledgerData.entries || []).length)}</strong> dari <strong style={{ color: '#0F172A' }}>{(ledgerData.entries || []).length}</strong> transaksi (Standar 10 baris/halaman)
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  onClick={() => setLCurrentPage(1)}
                  disabled={lCurrentPage === 1}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: '#FFFFFF', color: lCurrentPage === 1 ? '#CBD5E1' : '#475569',
                    border: '1.5px solid #E2E8F0', cursor: lCurrentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronsLeft style={{ width: '14px', height: '14px' }} />
                  First
                </button>
                <button
                  onClick={() => setLCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={lCurrentPage === 1}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: '#FFFFFF', color: lCurrentPage === 1 ? '#CBD5E1' : '#475569',
                    border: '1.5px solid #E2E8F0', cursor: lCurrentPage === 1 ? 'not-allowed' : 'pointer'
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
                  {lCurrentPage} / {lTotalPages}
                </span>
                <button
                  onClick={() => setLCurrentPage(prev => Math.min(lTotalPages, prev + 1))}
                  disabled={lCurrentPage === lTotalPages}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: '#FFFFFF', color: lCurrentPage === lTotalPages ? '#CBD5E1' : '#475569',
                    border: '1.5px solid #E2E8F0', cursor: lCurrentPage === lTotalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                  <ChevronRight style={{ width: '14px', height: '14px' }} />
                </button>
                <button
                  onClick={() => setLCurrentPage(lTotalPages)}
                  disabled={lCurrentPage === lTotalPages}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: '#FFFFFF', color: lCurrentPage === lTotalPages ? '#CBD5E1' : '#475569',
                    border: '1.5px solid #E2E8F0', cursor: lCurrentPage === lTotalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Last
                  <ChevronsRight style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-MENU: NERACA SALDO (TRIAL BALANCE)                                  */}
      {/* ========================================================================= */}
      {currentSubTab === 'trial-balance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Action Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: '1.125rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Scale style={{ width: '20px', height: '20px', color: '#0284C7' }} />
                Neraca Saldo (*Trial Balance*) Terpusat
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Ringkasan Keseimbangan Mutasi & Saldo Debet vs Kredit Seluruh Akun (*Balance Check*)
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={exportTrialBalanceCSV}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: '#FFFFFF', color: '#475569',
                  border: '1.5px solid #CBD5E1', cursor: 'pointer'
                }}
              >
                <Download style={{ width: '13px', height: '13px' }} />
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: '#FFFFFF', color: '#475569',
                  border: '1.5px solid #CBD5E1', cursor: 'pointer'
                }}
              >
                <Printer style={{ width: '13px', height: '13px' }} />
                Cetak Neraca Saldo
              </button>
            </div>
          </div>

          {/* Balance Check Banner */}
          <div style={{
            background: trialBalanceData.isBalanced ? 'linear-gradient(135deg, #ECFDF5, #F0FDF4)' : 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
            border: `2px solid ${trialBalanceData.isBalanced ? '#86EFAC' : '#FCA5A5'}`,
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '0.75rem',
                background: trialBalanceData.isBalanced ? '#DCFCE7' : '#FEE2E2',
                border: `1.5px solid ${trialBalanceData.isBalanced ? '#86EFAC' : '#FCA5A5'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: trialBalanceData.isBalanced ? '#15803D' : '#DC2626'
              }}>
                {trialBalanceData.isBalanced ? <CheckCircle2 style={{ width: '24px', height: '24px' }} /> : <AlertTriangle style={{ width: '24px', height: '24px' }} />}
              </div>
              <div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 900,
                  padding: '0.15rem 0.5rem', borderRadius: '0.375rem',
                  background: trialBalanceData.isBalanced ? '#15803D' : '#DC2626',
                  color: '#FFFFFF', letterSpacing: '0.04em'
                }}>
                  {trialBalanceData.isBalanced ? 'BALANCE CHECK: SEIMBANG ✓' : 'BALANCE CHECK: SELISIH !'}
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', margin: '0.25rem 0 0 0' }}>
                  {trialBalanceData.isBalanced
                    ? 'Total Saldo Debet dan Kredit Berada Pada Posisi Sempurna Seimbang'
                    : `Terdapat Selisih Neraca Sebesar Rp ${trialBalanceData.difference.toLocaleString('id-ID')}`}
                </h4>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontFamily: 'var(--font-mono)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Total Saldo Debet</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#16A34A' }}>
                  Rp {trialBalanceData.grandEndingDebit.toLocaleString('id-ID')}
                </span>
              </div>
              <div style={{ width: '1.5px', height: '36px', background: '#CBD5E1' }} />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Total Saldo Kredit</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0284C7' }}>
                  Rp {trialBalanceData.grandEndingCredit.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Trial Balance Filter Bar */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
            <div style={{ position: 'relative', width: '320px', minWidth: '240px' }}>
              <Search style={{ width: '14px', height: '14px', position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Cari akun di neraca saldo..."
                value={tbSearchQuery}
                onChange={(e) => setTbSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                  borderRadius: '0.625rem', fontSize: '0.8125rem', outline: 'none'
                }}
              />
            </div>

            <select
              value={tbPeriodFilter}
              onChange={(e) => setTbPeriodFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.875rem', background: '#F8FAFC',
                border: '1.5px solid #E2E8F0', borderRadius: '0.625rem',
                fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', cursor: 'pointer'
              }}
            >
              <option value="ALL">Semua Periode Akuntansi</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="LAST_MONTH">Bulan Lalu</option>
              <option value="THIS_YEAR">Tahun Ini</option>
            </select>
          </div>

          {/* Trial Balance Table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama Akun</th>
                    <th>Klasifikasi Akun</th>
                    <th>Normal</th>
                    <th style={{ textAlign: 'right' }}>Mutasi Debet (Rp)</th>
                    <th style={{ textAlign: 'right' }}>Mutasi Kredit (Rp)</th>
                    <th style={{ textAlign: 'right' }}>Saldo Debet (Rp)</th>
                    <th style={{ textAlign: 'right' }}>Saldo Kredit (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTbRows.map(r => (
                    <tr key={r.code}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284C7', fontSize: '0.8rem' }}>
                        <span
                          onClick={() => {
                            setSelectedLedgerAccount(r.code);
                            handleSubTabChange('ledger');
                          }}
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {r.code}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>
                        {r.name}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {r.classification || r.type}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 800,
                          padding: '0.1rem 0.4rem', borderRadius: '0.375rem',
                          background: r.isDebetNormal ? '#DCFCE7' : '#EFF6FF',
                          color: r.isDebetNormal ? '#15803D' : '#1D4ED8'
                        }}>
                          {r.normalPosition || 'DEBET'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#475569' }}>
                        {r.totalDebits > 0 ? `Rp ${r.totalDebits.toLocaleString('id-ID')}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#475569' }}>
                        {r.totalCredits > 0 ? `Rp ${r.totalCredits.toLocaleString('id-ID')}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#16A34A', fontSize: '0.8125rem' }}>
                        {r.saldoDebet > 0 ? `Rp ${r.saldoDebet.toLocaleString('id-ID')}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284C7', fontSize: '0.8125rem' }}>
                        {r.saldoKredit > 0 ? `Rp ${r.saldoKredit.toLocaleString('id-ID')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#F8FAFC', borderTop: '2px solid #CBD5E1', fontWeight: 900 }}>
                    <td colSpan="4" style={{ fontSize: '0.85rem', color: '#0F172A' }}>
                      TOTAL KESEIMBANGAN (BALANCE TOTAL)
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#475569' }}>
                      Rp {trialBalanceData.grandDebitMutations.toLocaleString('id-ID')}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#475569' }}>
                      Rp {trialBalanceData.grandCreditMutations.toLocaleString('id-ID')}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#16A34A' }}>
                      Rp {trialBalanceData.grandEndingDebit.toLocaleString('id-ID')}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#0284C7' }}>
                      Rp {trialBalanceData.grandEndingCredit.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-MENU: LAPORAN LABA RUGI (INCOME STATEMENT)                          */}
      {/* ========================================================================= */}
      {currentSubTab === 'income-statement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Action Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: '1.125rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <TrendingUp style={{ width: '20px', height: '20px', color: '#0284C7' }} />
                Laporan Laba Rugi (*Income Statement*)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Perhitungan Otomatis: Revenue − HPP − OPEX = Net Profit (FSD v2.0 Section 3)
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={isPeriodFilter}
                onChange={(e) => setIsPeriodFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem', background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0', borderRadius: '0.625rem',
                  fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer'
                }}
              >
                <option value="THIS_MONTH">Bulan Ini</option>
                <option value="LAST_MONTH">Bulan Lalu</option>
                <option value="THIS_YEAR">Tahun Ini</option>
                <option value="ALL">Semua Periode</option>
                <option value="CUSTOM">Rentang Tanggal Kustom...</option>
              </select>

              <button
                onClick={exportIncomeStatementCSV}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: '#FFFFFF', color: '#475569',
                  border: '1.5px solid #CBD5E1', cursor: 'pointer'
                }}
              >
                <Download style={{ width: '13px', height: '13px' }} />
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: '#FFFFFF', color: '#475569',
                  border: '1.5px solid #CBD5E1', cursor: 'pointer'
                }}
              >
                <Printer style={{ width: '13px', height: '13px' }} />
                Cetak Laporan
              </button>
            </div>
          </div>

          {isPeriodFilter === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.875rem', background: '#F0F9FF', borderRadius: '0.625rem', border: '1px solid #BAE6FD', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1' }}>Rentang Periode Laba Rugi:</span>
              <input
                type="date"
                value={isStartDate}
                onChange={(e) => setIsStartDate(e.target.value)}
                style={{ padding: '0.35rem 0.6rem', background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '0.5rem', fontSize: '0.75rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>s/d</span>
              <input
                type="date"
                value={isEndDate}
                onChange={(e) => setIsEndDate(e.target.value)}
                style={{ padding: '0.35rem 0.6rem', background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '0.5rem', fontSize: '0.75rem' }}
              />
              {(isStartDate || isEndDate) && (
                <button
                  onClick={() => { setIsStartDate(''); setIsEndDate(''); }}
                  style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {/* Comparative Margin Flow Bar */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
                Komparasi Struktur Finansial (Revenue vs HPP vs OPEX vs Net Profit)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7' }}>
                  Gross Margin: {incomeStatementData.grossMarginPercent}%
                </span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 800,
                  color: incomeStatementData.isProfit ? '#16A34A' : '#DC2626'
                }}>
                  Net Margin: {incomeStatementData.netMarginPercent}%
                </span>
              </div>
            </div>

            {/* Visual Bar Stack */}
            <div style={{ width: '100%', height: '14px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
              <div style={{
                width: `${incomeStatementData.revenue > 0 ? (incomeStatementData.hpp / incomeStatementData.revenue) * 100 : 0}%`,
                background: '#F59E0B',
                title: 'HPP Bahan Baku'
              }} />
              <div style={{
                width: `${incomeStatementData.revenue > 0 ? (incomeStatementData.totalOpex / incomeStatementData.revenue) * 100 : 0}%`,
                background: '#8B5CF6',
                title: 'Total OPEX'
              }} />
              <div style={{
                width: `${incomeStatementData.revenue > 0 && incomeStatementData.isProfit ? (incomeStatementData.netProfit / incomeStatementData.revenue) * 100 : 0}%`,
                background: '#10B981',
                title: 'Laba Bersih'
              }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.72rem', color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#F59E0B' }} /> HPP Bahan ({incomeStatementData.revenue > 0 ? Math.round((incomeStatementData.hpp / incomeStatementData.revenue) * 100) : 0}%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#8B5CF6' }} /> OPEX Operasional ({incomeStatementData.revenue > 0 ? Math.round((incomeStatementData.totalOpex / incomeStatementData.revenue) * 100) : 0}%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981' }} /> Laba Bersih ({incomeStatementData.netMarginPercent}%)
              </span>
            </div>
          </div>

          {/* Formal Income Statement Card */}
          <div className="glass-card" style={{ padding: '1.75rem', maxWidth: '780px', margin: '0 auto', width: '100%' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                KOPI SESUK — LAPORAN LABA RUGI
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.25rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                STANDAR AKUNTANSI DOUBLE-ENTRY TERINTEGRASI (FSD v2.0)
              </p>
            </div>

            {/* Income Statement Line Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

              {/* 1. Pendapatan Penjualan */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <div>
                  <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.875rem' }}>1. PENDAPATAN USAHA (REVENUE)</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Akun 401 — Penjualan PO Instansi, Penjualan CFD & POS Kasir</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.95rem', color: '#0284C7' }}>
                  Rp {incomeStatementData.revenue.toLocaleString('id-ID')}
                </span>
              </div>

              {/* 2. HPP */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', paddingLeft: '1rem', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.825rem' }}>(-) Beban Pokok Penjualan (HPP Kopi)</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Akun 501 — Deduksi Bahan Baku Hasil Rekapitulasi Formula BOM</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: '#DC2626' }}>
                  (Rp {incomeStatementData.hpp.toLocaleString('id-ID')})
                </span>
              </div>

              {/* 3. Laba Kotor */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', background: '#F0FDF4', borderRadius: '0.75rem', border: '1.5px solid #86EFAC', margin: '0.25rem 0'
              }}>
                <div>
                  <span style={{ fontWeight: 900, color: '#15803D', fontSize: '0.875rem' }}>LABA KOTOR (GROSS PROFIT)</span>
                  <span style={{ fontSize: '0.72rem', color: '#166534', display: 'block' }}>Revenue − HPP Bahan Baku</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.05rem', color: '#16A34A', display: 'block' }}>
                    Rp {incomeStatementData.grossProfit.toLocaleString('id-ID')}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700 }}>
                    Gross Margin: {incomeStatementData.grossMarginPercent}%
                  </span>
                </div>
              </div>

              {/* 4. Beban Operasional Section */}
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.875rem' }}>2. BEBAN OPERASIONAL (OPERATING EXPENSES / OPEX)</span>
              </div>

              {/* 4a. OPEX Rutin */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0 0.4rem 1rem' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>Beban Operasional Rutin Toko</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Akun 502 — Biaya Kebersihan, Keamanan, Sewa Tempat, Listrik, BPP</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: '#7C3AED' }}>
                  Rp {incomeStatementData.opexRutin.toLocaleString('id-ID')}
                </span>
              </div>

              {/* 4b. OPEX Waste CFD */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0 0.4rem 1rem', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>Beban Waste / Kerugian CFD</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Akun 504 — Kerugian Sisa Minuman Olahan CFD Tidak Terjual / Rusak</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: '#7C3AED' }}>
                  Rp {incomeStatementData.opexWaste.toLocaleString('id-ID')}
                </span>
              </div>

              {incomeStatementData.opexLain > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0 0.4rem 1rem', borderBottom: '1px solid #F1F5F9' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>Biaya Operasional Lain-lain</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Akun 601 — Pengeluaran Tambahan Operasional</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: '#7C3AED' }}>
                    Rp {incomeStatementData.opexLain.toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {/* Total OPEX */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: '#F8FAFC', borderRadius: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.825rem' }}>(-) Total Beban Operasional (OPEX)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.875rem', color: '#7C3AED' }}>
                  (Rp {incomeStatementData.totalOpex.toLocaleString('id-ID')})
                </span>
              </div>

              {/* 5. Net Profit */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem 1.25rem', marginTop: '0.5rem',
                background: incomeStatementData.isProfit ? 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' : 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                borderRadius: '0.875rem',
                border: `2px solid ${incomeStatementData.isProfit ? '#86EFAC' : '#FCA5A5'}`
              }}>
                <div>
                  <span style={{ fontWeight: 900, color: '#0F172A', fontSize: '0.95rem', display: 'block' }}>
                    {incomeStatementData.isProfit ? 'LABA BERSIH (NET PROFIT)' : 'DEFISIT / RUGI BERSIH (NET LOSS)'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Gross Profit − Total Beban OPEX
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.35rem',
                    color: incomeStatementData.isProfit ? '#16A34A' : '#DC2626', display: 'block'
                  }}>
                    Rp {incomeStatementData.netProfit.toLocaleString('id-ID')}
                  </span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 800,
                    color: incomeStatementData.isProfit ? '#15803D' : '#DC2626'
                  }}>
                    Net Profit Margin: {incomeStatementData.netMarginPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-MENU: LAPORAN NERACA (BALANCE SHEET)                                 */}
      {/* ========================================================================= */}
      {currentSubTab === 'balance-sheet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Action Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: '1.125rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Landmark style={{ width: '20px', height: '20px', color: '#0284C7' }} />
                Laporan Neraca Keuangan (*Balance Sheet*)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Menyajikan Posisi Real-Time: Aset = Kewajiban + Ekuitas (FSD v2.0 Section 3)
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.35rem 0.65rem', borderRadius: '0.625rem', border: '1.5px solid #E2E8F0' }}>
                <Calendar style={{ width: '14px', height: '14px', color: '#0284C7' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Posisi Per:</span>
                <input
                  type="date"
                  value={bsAsOfDate}
                  onChange={(e) => setBsAsOfDate(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                />
              </div>

              <button
                onClick={exportBalanceSheetCSV}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: '#FFFFFF', color: '#475569',
                  border: '1.5px solid #CBD5E1', cursor: 'pointer'
                }}
              >
                <Download style={{ width: '13px', height: '13px' }} />
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.625rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: '#FFFFFF', color: '#475569',
                  border: '1.5px solid #CBD5E1', cursor: 'pointer'
                }}
              >
                <Printer style={{ width: '13px', height: '13px' }} />
                Cetak Neraca
              </button>
            </div>
          </div>

          {/* Balance Equation Indicator Banner */}
          <div style={{
            background: balanceSheetData.isBalanced ? 'linear-gradient(135deg, #ECFDF5, #F0FDF4)' : 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
            border: `2px solid ${balanceSheetData.isBalanced ? '#86EFAC' : '#FCA5A5'}`,
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '0.75rem',
                background: balanceSheetData.isBalanced ? '#DCFCE7' : '#FEE2E2',
                border: `1.5px solid ${balanceSheetData.isBalanced ? '#86EFAC' : '#FCA5A5'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: balanceSheetData.isBalanced ? '#15803D' : '#DC2626'
              }}>
                {balanceSheetData.isBalanced ? <CheckCircle2 style={{ width: '24px', height: '24px' }} /> : <AlertTriangle style={{ width: '24px', height: '24px' }} />}
              </div>
              <div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 900,
                  padding: '0.15rem 0.5rem', borderRadius: '0.375rem',
                  background: balanceSheetData.isBalanced ? '#15803D' : '#DC2626',
                  color: '#FFFFFF', letterSpacing: '0.04em'
                }}>
                  {balanceSheetData.isBalanced ? 'PERSAMAAN NERACA SEIMBANG ✓' : 'PERINGATAN SELISIH NERACA'}
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', margin: '0.25rem 0 0 0' }}>
                  ASET = KEWAJIBAN + EKUITAS (Double-Entry Balance Verified)
                </h4>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontFamily: 'var(--font-mono)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Total Aset (Aktiva)</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0284C7' }}>
                  Rp {balanceSheetData.totalAset.toLocaleString('id-ID')}
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', color: '#64748B', fontWeight: 900 }}>=</div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Kewajiban + Ekuitas (Pasiva)</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#16A34A' }}>
                  Rp {balanceSheetData.totalPasiva.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Sheet 2-Column Skontro Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>

            {/* SISI KIRI: AKTIVA (ASET) */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ borderBottom: '2px solid #0284C7', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontWeight: 900, color: '#0284C7', fontSize: '1rem', margin: 0 }}>
                    SISI AKTIVA (ASET)
                  </h4>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '0.375rem', background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD' }}>
                    Debet Normal
                  </span>
                </div>

                {/* Aset Lancar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    A. Aset Lancar (Current Assets)
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: '#F8FAFC', borderRadius: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>101 Kas & Bank (Kas Store / QRIS)</span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Hasil penjualan POS/PO & pembayaran opex</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.825rem', color: '#0F172A' }}>
                        Rp {balanceSheetData.kas.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: '#F8FAFC', borderRadius: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>102 Persediaan Bahan Baku & Stok</span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Restock supplier dikurangi deduksi BOM & waste</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.825rem', color: '#0F172A' }}>
                        Rp {balanceSheetData.persediaan.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#EFF6FF', borderRadius: '0.5rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1D4ED8' }}>Subtotal Aset Lancar</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.875rem', color: '#1D4ED8' }}>
                        Rp {balanceSheetData.asetLancar.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aset Tetap */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    B. Aset Tetap (Fixed Assets / CAPEX)
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: '#F8FAFC', borderRadius: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>103 Aset Tetap Peralatan</span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Mesin Espresso, Grinder, Blender, Coolbox</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.825rem', color: '#0F172A' }}>
                        Rp {balanceSheetData.peralatan.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: '#F8FAFC', borderRadius: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>104 Aset Perlengkapan Toko</span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Meja Lipat CFD, Banner Promosi, Tenda Canopy</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.825rem', color: '#0F172A' }}>
                        Rp {balanceSheetData.perlengkapan.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#EFF6FF', borderRadius: '0.5rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1D4ED8' }}>Subtotal Aset Tetap</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.875rem', color: '#1D4ED8' }}>
                        Rp {balanceSheetData.asetTetap.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Aktiva Footer */}
              <div style={{
                marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid #0284C7',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0284C7' }}>
                  TOTAL AKTIVA (ASET)
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.25rem', color: '#0284C7' }}>
                  Rp {balanceSheetData.totalAset.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* SISI KANAN: PASIVA (KEWAJIBAN & EKUITAS) */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ borderBottom: '2px solid #16A34A', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontWeight: 900, color: '#16A34A', fontSize: '1rem', margin: 0 }}>
                    SISI PASIVA (KEWAJIBAN & EKUITAS)
                  </h4>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '0.375rem', background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
                    Kredit Normal
                  </span>
                </div>

                {/* Kewajiban / Liabilitas */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    A. Kewajiban (Liabilitas)
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: '#F8FAFC', borderRadius: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>201 Hutang Usaha / Vendor Supplier</span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Kewajiban pembelian bahan baku kredit tempo</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.825rem', color: '#0F172A' }}>
                        Rp {balanceSheetData.hutang.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#F0FDF4', borderRadius: '0.5rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#15803D' }}>Total Kewajiban</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.875rem', color: '#15803D' }}>
                        Rp {balanceSheetData.totalKewajiban.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ekuitas */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    B. Ekuitas (Equity)
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: '#F8FAFC', borderRadius: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>301 Modal Toko / Pemilik</span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Modal disetor pemilik terpusat</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.825rem', color: '#0F172A' }}>
                        Rp {balanceSheetData.modal.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: '#F8FAFC', borderRadius: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Laba Bersih Periode Berjalan</span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Net Profit dari Laporan Laba Rugi (Revenue − HPP − OPEX)</span>
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.825rem',
                        color: balanceSheetData.currentNetProfit >= 0 ? '#16A34A' : '#DC2626'
                      }}>
                        Rp {balanceSheetData.currentNetProfit.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#F0FDF4', borderRadius: '0.5rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#15803D' }}>Total Ekuitas</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.875rem', color: '#15803D' }}>
                        Rp {balanceSheetData.totalEkuitas.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Pasiva Footer */}
              <div style={{
                marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid #16A34A',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#16A34A' }}>
                  TOTAL PASIVA (KEWAJIBAN + EKUITAS)
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.25rem', color: '#16A34A' }}>
                  Rp {balanceSheetData.totalPasiva.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
