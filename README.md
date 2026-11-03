# Centralized ERP System — Kopi Sesuk (v2.0 Major Release)

Dokumen Spesifikasi: **Functional System Design (FSD) v2.0 - Kopi Sesuk ERP**  
Dokumen ID: `FSD-KS-2026-V2.0`  
Tanggal Efektif: **November 2026**  
Target Platform: **Web & Mobile ERP**  
Tech Stack: **React 18 + Vite, Tailwind CSS, Supabase PostgreSQL, Lucide React**

---

## 1. Ringkasan Eksekutif & Pembaruan Major v2.0

Rilis Major **ERP Kopi Sesuk v2.0** memperkenalkan **Modul Utama Akuntansi & Buku Besar (General Ledger System) sebagai menu mandiri** pada sidebar navigasi ERP. Modul ini menjadi pusat integrasi data keuangan dari seluruh aktivitas operasional (PO, Sales CFD, Pembelian Bahan, OPEX, CAPEX, dan Waste) guna menghasilkan Laporan Keuangan Otomatis dan Terintegrasi berbasis pembukuan berpasangan (*Double-Entry Bookkeeping*).

---

## 2. Centralized Chart of Accounts (COA) / Daftar Akun Terpusat

Setiap transaksi operasional secara otomatis dicatat pada kode akun standar yang dikelompokkan ke dalam 5 klasifikasi utama:

| Kode Akun | Nama Akun | Kelompok Akun | Posisi Normal | Sumber Transaksi Utama |
|---|---|---|---|---|
| **101** | Kas & Bank (Kas Store / QRIS) | Aset (Aktiva Lancar) | **Debet** | Penjualan POS/PO, Pembayaran OPEX & CAPEX |
| **102** | Persediaan Bahan Baku & Stok | Aset (Aktiva Lancar) | **Debet** | Restock Bahan Baku Supplier, Deduksi Resep BOM |
| **103** | Aset Tetap Peralatan (CAPEX) | Aset (Aktiva Tetap) | **Debet** | Pembelian Mesin Espresso, Grinder, Blender, Coolbox |
| **104** | Aset Perlengkapan Toko (CAPEX) | Aset (Aktiva Tetap) | **Debet** | Pembelian Meja CFD, Banner Promosi, Canopy Tent |
| **201** | Hutang Usaha / Vendor Supplier | Kewajiban (Liabilitas) | **Kredit** | Pembelian Bahan Baku Kredit Tempo Supplier |
| **301** | Modal Toko / Pemilik | Ekuitas | **Kredit** | Modal Terpusat Pemilik Toko |
| **401** | Pendapatan Penjualan (Sales) | Pendapatan (Revenue) | **Kredit** | Penjualan PO Instansi, Penjualan CFD & POS Kasir |
| **501** | Beban Pokok Penjualan (HPP Kopi) | Beban (HPP/BPP) | **Debet** | Pengurangan Bahan Baku Hasil Rekapitulasi Formula BOM |
| **502** | Beban Operasional Rutin (OPEX) | Beban Operasional | **Debet** | Biaya Kebersihan, Keamanan, Sewa Tempat, Listrik, BPP |
| **504** | Beban Waste / Kerugian CFD | Beban Operasional | **Debet** | Sisa Minuman Olahan CFD Tidak Terjual / Rusak |

---

## 3. Modul Utama Akuntansi & Buku Besar (General Ledger System)

Menu Utama Mandiri pada sidebar navigasi ERP: **`[ MODUL AKUNTANSI & KEUANGAN ]`** dengan 5 sub-menu lengkap:

1. **Menu Jurnal Umum (General Journal)**:
   - Log riwayat urut waktu (*chronological*) seluruh mutasi debet dan kredit.
   - Indikator validasi keseimbangan (*Double-Entry Balance Verified*).
   - Filter Pencarian Global (*Search Keyword*), Filter Periode Cepat (*Bulan Ini, Bulan Lalu, Tahun Ini*), dan Rentang Tanggal Kustom.
   - Pembatasan tabel 10 baris per halaman (*Standard Pagination*).

2. **Menu Buku Besar (General Ledger)**:
   - Rekapitulasi mutasi dan saldo berjalan (*running balance*) per akun terpilih (misal: Khusus Akun 101 Kas, Akun 501 HPP, Akun 102 Persediaan, dsb).
   - Kartu ringkasan spesifikasi akun: Klasifikasi, Posisi Normal, Sumber Transaksi Utama, Total Debet, Total Kredit, dan Saldo Akhir.
   - Selector akun cepat (*Account Pills & Dropdown*).
   - Fitur Export CSV dan Cetak Buku Besar per-akun.

3. **Menu Neraca Saldo (Trial Balance)**:
   - Ringkasan keseimbangan (*balance check*) seluruh akun COA secara menyeluruh.
   - Membandingkan Total Mutasi Debet vs Kredit dan Total Saldo Debet vs Kredit.
   - Indikator status: `STATUS: NERACA SALDO SEIMBANG (TRIAL BALANCE BALANCED) ✓`.

4. **Menu Laporan Laba Rugi (Income Statement)**:
   - Perhitungan Otomatis:  
     $$\text{Net Profit} = \text{Revenue} - \text{HPP} - \text{OPEX}$$
   - Rincian Pendapatan (Akun 401), HPP BOM (Akun 501), Laba Kotor (*Gross Profit*), Beban Operasional Rutin (Akun 502), dan Beban Waste CFD (Akun 504).
   - Grafik Komparasi Struktur Finansial & Persentase Margin Laba (*Gross Margin %* dan *Net Margin %*).

5. **Menu Laporan Neraca (Balance Sheet)**:
   - Menyajikan Posisi Keuangan Real-Time berbasis Persamaan Akuntansi:  
     $$\text{Aset (Aktiva)} = \text{Kewajiban} + \text{Ekuitas (Pasiva)}$$
   - Sisi Aktiva: Aset Lancar (Kas & Persediaan) + Aset Tetap (Peralatan & Perlengkapan).
   - Sisi Pasiva: Kewajiban (Hutang Vendor) + Ekuitas (Modal Toko & Laba Bersih Berjalan).
   - Validasi keseimbangan otomatis dengan visual indikator seimbang (*Zero Difference*).

---

## 4. Mekanisme OPEX, CAPEX, & Penyesuaian Sisa CFD

Pengeluaran operasional dan penyesuaian penjualan CFD diintegrasikan langsung ke dalam Buku Besar secara otomatis saat status transaksi diselesaikan:

- **OPEX Rutin**: Input biaya kebersihan, keamanan, sewa, listrik, utilitas, BPP. Upload bukti pembayaran nota/kwitansi.
  - *Dampak GL*: **Debet 502 Beban Operasional / Kredit 101 Kas & Bank**
- **CAPEX Asset Purchase**: Input barang modal (mesin espresso, grinder, coolbox, meja CFD, banner, canopy). Input estimasi masa manfaat (bulan).
  - *Dampak GL*: **Debet 103/104 Aset Peralatan/Perlengkapan / Kredit 101 Kas & Bank atau 201 Hutang**
- **CFD Sisa Produk (Waste)**: Batch sesi CFD bersifat *editable*. Produk olahan yang tidak terjual pada akhir sesi otomatis dialokasikan sebagai Beban Waste CFD.
  - *Dampak GL*: **Debet 504 Beban Waste CFD / Kredit 102 Persediaan Bahan Baku**

---

## 5. Alert Pre-Order (PO) H-1 di Dashboard

Background job memindai jadwal pesanan PO esok hari (H-1) dan mencocokkannya dengan ketersediaan stok bahan baku berbasis formula BOM:

```
FOR EACH PO Order ON (Tomorrow):
  Required_BOM = Calculate_BOM(Order_Items)
  IF (Available_Stock(BOM) < Required_BOM) THEN
    Trigger_Dashboard_Alert("INSUFFICIENT STOCK - PO H-1", Critical)
  ELSE
    Trigger_Dashboard_Alert("READY TO PREPARE - PO H-1", Success)
  ENDIF
```

- **READY TO PREPARE**: Menampilkan checklist menu yang harus diracik dan tombol cepat **Cetak Work Order Schedule**.
- **INSUFFICIENT STOCK**: Peringatan merah darurat menampilkan daftar bahan baku yang kurang dan tombol cepat **Order Bahan Baku (Stock In)**.

---

## 6. Logika Automasi Promo Bundle 1 Liter

Penerapan aturan harga khusus secara otomatis pada keranjang belanja (*Cart POS & PO Schedule*) tanpa input diskon manual per varian produk:

```
IF ( SUM(Qty_Botol_1L_All_Variants) >= 2 ) THEN
  Price_Per_Botol_1L = Rp 55.000
ELSE
  Price_Per_Botol_1L = Rp 60.000
ENDIF
```

- **Kondisi Normal (Total Qty 1L < 2 Botol)**: Harga per botol = **Rp 60.000**.
- **Kondisi Promo Tiering (Total Qty 1L ≥ 2 Botol)**: Harga per botol otomatis disesuaikan menjadi **Rp 55.000** (berlaku kelipatan & kombinasi varian rasa, misal 1L Coklat + 1L Kopi Susu Aren = Rp 110.000, hemat Rp 10.000).

---

## 7. Standardisasi UI Tabel Data

Seluruh tabel data operasional, inventori, laporan, dan buku besar menerapkan UI standar:
1. **Global Keyword Search**: Filter instan berdasarkan No. Ref, Customer, Keterangan, atau Nama Akun.
2. **Month / Date Range Filter**: Pilihan cepat (Bulan Ini, Bulan Lalu, Tahun Ini) dan Kustom Tanggal (Start Date s/d End Date).
3. **Pagination Konsisten**: Tepat **10 baris data per halaman** dengan tombol navigasi `[First] [Prev] [Page X / Y] [Next] [Last]`.

---

## Menjalankan Aplikasi

```bash
# Install dependencies
npm install

# Jalankan server pengembangan lokal
npm run dev

# Build produksi
npm run build
```
