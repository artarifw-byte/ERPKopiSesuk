import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

const ERPContext = createContext();

export const ERPProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(() => localStorage.getItem('ks_role') || 'super_admin');
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.replace(/^\/+|\/+$/g, '') || 'dashboard';
  const setActiveTab = (tab) => navigate('/' + tab);
  const [toast, setToast] = useState(null);

  // States populated entirely from Supabase database
  const [coa, setCoa] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [bom, setBom] = useState([]);
  const [orders, setOrders] = useState([]);
  const [opex, setOpex] = useState([]);
  const [journal, setJournal] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Audit logs state (with localStorage persistence)
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('ks_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ks_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Failed to save audit logs to localStorage:', e);
    }
  }, [auditLogs]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const logAudit = async ({ action, category = 'SISTEM', description, details = null, user = null, role = null }) => {
    const newEntry = {
      id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      user: user || 'admin@kopisesuk.com',
      role: role || 'Admin ERP',
      action,
      category,
      description,
      details
    };
    setAuditLogs(prev => [newEntry, ...(prev || [])]);

    // Simpan otomatis ke tabel audit_logs Supabase jika tabel sudah dibuat
    try {
      await supabase.from('audit_logs').insert({
        timestamp: newEntry.timestamp,
        user_email: newEntry.user,
        role: newEntry.role,
        action: newEntry.action,
        category: newEntry.category,
        description: newEntry.description,
        details: newEntry.details || {}
      });
    } catch (e) {
      // Graceful fallback jika tabel audit_logs baru akan dieksekusi oleh user
      console.warn('Audit log Supabase sync pending DDL execution:', e);
    }
  };

  // Auto-log page navigation
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      const titles = {
        '/dashboard': 'Dashboard Overview & Performance',
        '/pos': 'POS Sales & Cashier Workstation',
        '/orders': 'PO Schedule & Sales Management',
        '/inventory': 'Stok & Inventory Control',
        '/bom': 'Resep BOM (Takaran Matrix)',
        '/journal': 'Jurnal Akuntansi Double-Entry',
        '/reports': 'Laporan Keuangan & BEP',
        '/audit': 'Audit Trail & Log Aktivitas',
        '/ddl': 'Supabase PostgreSQL DDL Script',
        '/login': 'Halaman Login'
      };
      const pageTitle = titles[location.pathname] || `Halaman ${location.pathname}`;
      logAudit({
        action: 'NAVIGATE',
        category: 'NAVIGASI',
        description: `Membuka modul ${pageTitle}`,
        details: { path: location.pathname, from: prevPathRef.current }
      });
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  // Formatter helpers for normalization
  const formatMaterial = (m) => ({
    id: m.id,
    name: m.name,
    unit: m.base_unit || m.unit || 'gram',
    base_unit: m.base_unit || m.unit || 'gram',
    currentStock: Number(m.current_stock ?? m.currentStock ?? 0),
    current_stock: Number(m.current_stock ?? m.currentStock ?? 0),
    unitPrice: Number(m.unit_price ?? m.unitPrice ?? 0),
    unit_price: Number(m.unit_price ?? m.unitPrice ?? 0),
    avgDailyUsage: Number(m.avg_daily_usage ?? m.avgDailyUsage ?? 0),
    avg_daily_usage: Number(m.avg_daily_usage ?? m.avgDailyUsage ?? 0),
    maxDailyUsage: Number(m.max_daily_usage ?? m.maxDailyUsage ?? 0),
    max_daily_usage: Number(m.max_daily_usage ?? m.maxDailyUsage ?? 0),
    avgLeadTimeDays: Number(m.avg_lead_time_days ?? m.avgLeadTimeDays ?? 1),
    avg_lead_time_days: Number(m.avg_lead_time_days ?? m.avgLeadTimeDays ?? 1),
    maxLeadTimeDays: Number(m.max_lead_time_days ?? m.maxLeadTimeDays ?? 2),
    max_lead_time_days: Number(m.max_lead_time_days ?? m.maxLeadTimeDays ?? 2)
  });

  // Fetch all ERP data from Supabase
  const fetchAllFromSupabase = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setIsSyncing(true);

    try {
      const [
        { data: coaData, error: errCoa },
        { data: matsData, error: errMats },
        { data: prodsData, error: errProds },
        { data: varsData, error: errVars },
        { data: bomData, error: errBom },
        { data: ordersData, error: errOrders },
        { data: opexData, error: errOpex },
        { data: journalData, error: errJournal },
        { data: auditData, error: errAudit }
      ] = await Promise.all([
        supabase.from('chart_of_accounts').select('*').order('code'),
        supabase.from('raw_materials').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
        supabase.from('product_variants').select('*'),
        supabase.from('bom_recipes').select('*'),
        supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
        supabase.from('opex_expenses').select('*').order('expense_date', { ascending: false }),
        supabase.from('journal_entries').select('*, journal_items(*)').order('entry_date', { ascending: false }),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200)
      ]);

      if (errMats) console.warn('Supabase fetch materials warning:', errMats.message);

      // COA Map for fast naming
      const coaMap = {};
      const formattedCoa = (coaData || []).map(c => {
        coaMap[c.code] = c.name;
        return {
          code: c.code,
          name: c.name,
          type: c.type,
          desc: c.description || '',
          description: c.description || ''
        };
      });
      setCoa(formattedCoa);

      // Format Materials
      const formattedMats = (matsData || []).map(formatMaterial);
      setMaterials(formattedMats);

      // Assemble Products with nested Variants
      const formattedProds = (prodsData || []).map(p => {
        const productVars = (varsData || [])
          .filter(v => v.product_id === p.id)
          .map(v => ({
            id: v.id,
            productId: p.id,
            product_id: p.id,
            sizeLabel: v.size_label,
            size_label: v.size_label,
            sizeMl: Number(v.size_ml),
            size_ml: Number(v.size_ml),
            sellingPrice: Number(v.selling_price),
            selling_price: Number(v.selling_price),
            price: Number(v.selling_price)
          }));

        return {
          id: p.id,
          name: p.name,
          code: p.code,
          category: p.category || 'Kopi',
          variants: productVars
        };
      });
      setProducts(formattedProds);

      // Format BOM
      const formattedBom = (bomData || []).map(b => ({
        id: b.id,
        variantId: b.variant_id,
        variant_id: b.variant_id,
        materialId: b.raw_material_id,
        raw_material_id: b.raw_material_id,
        qty: Number(b.qty_required),
        qty_required: Number(b.qty_required)
      }));
      setBom(formattedBom);

      // Build variant lookup map untuk resolve productName & sizeLabel di order_items
      const variantMap = {};
      (varsData || []).forEach(v => {
        const prod = (prodsData || []).find(p => p.id === v.product_id);
        variantMap[v.id] = {
          productName: prod?.name || 'Produk',
          sizeLabel: v.size_label || '',
          sizeMl: Number(v.size_ml) || 0,
        };
      });

      // Format Orders
      const formattedOrders = (ordersData || []).map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        order_number: o.order_number,
        customerName: o.customer_name,
        customer_name: o.customer_name,
        segment: o.segment,
        deliveryDate: o.delivery_date,
        delivery_date: o.delivery_date,
        status: o.status,
        paymentStatus: o.payment_status,
        payment_status: o.payment_status,
        paymentMethod: o.payment_method,
        payment_method: o.payment_method,
        totalAmount: Number(o.total_amount),
        total_amount: Number(o.total_amount),
        totalHPP: Number(o.total_hpp),
        total_hpp: Number(o.total_hpp),
        notes: o.notes || '',
        items: (o.order_items || []).map(item => {
          const vInfo = variantMap[item.variant_id] || {};
          return {
            id: item.id,
            variantId: item.variant_id,
            variant_id: item.variant_id,
            productName: vInfo.productName || 'Produk',
            sizeLabel: vInfo.sizeLabel || '',
            sizeMl: vInfo.sizeMl || 0,
            sugarLevel: item.sugar_level || 'Normal',
            qty: Number(item.quantity),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unit_price),
            unitHPP: Number(item.unit_hpp || 0),
            subtotal: Number(item.subtotal),
            subtotalHPP: Number(item.subtotal_hpp || 0)
          };
        })
      }));
      setOrders(formattedOrders);

      // Format OPEX
      const formattedOpex = (opexData || []).map(op => ({
        id: op.id,
        date: op.expense_date,
        expense_date: op.expense_date,
        category: op.category,
        description: op.description || '',
        amount: Number(op.amount),
        paymentAccountCode: op.payment_account_code || '101'
      }));
      setOpex(formattedOpex);

      // Format Journal Entries
      const formattedJournal = (journalData || []).map(j => ({
        id: j.id,
        date: j.entry_date,
        entry_date: j.entry_date,
        ref: j.reference_number || '',
        reference_number: j.reference_number || '',
        description: j.description,
        items: (j.journal_items || []).map(item => ({
          id: item.id,
          accountCode: item.account_code,
          account_code: item.account_code,
          accountName: coaMap[item.account_code] || item.account_code,
          debit: Number(item.debit || 0),
          credit: Number(item.credit || 0)
        }))
      }));
      setJournal(formattedJournal);

      // Format Audit Logs jika tabel sudah ada di Supabase
      if (!errAudit && auditData && auditData.length > 0) {
        const formattedAudit = auditData.map(a => ({
          id: a.id,
          timestamp: a.timestamp,
          user: a.user_email || a.user || 'admin@kopisesuk.com',
          role: a.role || 'Admin ERP',
          action: a.action,
          category: a.category,
          description: a.description,
          details: a.details
        }));
        setAuditLogs(formattedAudit);
      }

    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
      showToast('Gagal memuat data dari Supabase: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchAllFromSupabase(true);
  }, []);

  // Helper: Calculate Safety Stock & Reorder Point
  const calculateSSAndROP = (mat) => {
    const avgUsage = Number(mat.avgDailyUsage ?? mat.avg_daily_usage ?? 0);
    const maxUsage = Number(mat.maxDailyUsage ?? mat.max_daily_usage ?? 0);
    const avgLT = Number(mat.avgLeadTimeDays ?? mat.avg_lead_time_days ?? 1);
    const maxLT = Number(mat.maxLeadTimeDays ?? mat.max_lead_time_days ?? 2);
    const currentStock = Number(mat.currentStock ?? mat.current_stock ?? 0);

    const ss = Math.max(0, Math.round((maxUsage * maxLT) - (avgUsage * avgLT)));
    const rop = Math.round((avgUsage * avgLT) + ss);

    let status = 'SAFE';
    if (currentStock <= ss) {
      status = 'CRITICAL';
    } else if (currentStock <= rop) {
      status = 'REORDER';
    }

    return { ss, rop, status };
  };

  // Helper: Calculate variant HPP based on BOM
  const calculateVariantHPP = (variantId) => {
    const recipeItems = bom.filter(b => b.variantId === variantId || b.variant_id === variantId);
    let totalHPP = 0;
    recipeItems.forEach(b => {
      const mat = materials.find(m => m.id === (b.materialId || b.raw_material_id));
      if (mat) {
        totalHPP += (Number(b.qty ?? b.qty_required ?? 0)) * (Number(mat.unitPrice ?? mat.unit_price ?? 0));
      }
    });
    return Math.round(totalHPP);
  };

  // Helper: Get all variants with calculated HPP
  const getVariantsWithHPP = () => {
    const result = [];
    products.forEach(p => {
      (p.variants || []).forEach(v => {
        const sellingPrice = Number(v.sellingPrice ?? v.price ?? v.selling_price ?? 0);
        result.push({
          ...v,
          sellingPrice,
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          hpp: calculateVariantHPP(v.id)
        });
      });
    });
    return result;
  };

  // ==========================================
  // CRUD BAHAN BAKU (RAW MATERIALS) SUPABASE
  // ==========================================
  const addMaterial = async (matData) => {
    try {
      const payload = {
        name: matData.name,
        base_unit: matData.unit || matData.base_unit || 'gram',
        current_stock: Number(matData.currentStock ?? matData.current_stock ?? 0),
        unit_price: Number(matData.unitPrice ?? matData.unit_price ?? 0),
        avg_daily_usage: Number(matData.avgDailyUsage ?? matData.avg_daily_usage ?? 0),
        max_daily_usage: Number(matData.maxDailyUsage ?? matData.max_daily_usage ?? 0),
        avg_lead_time_days: Number(matData.avgLeadTimeDays ?? matData.avg_lead_time_days ?? 1),
        max_lead_time_days: Number(matData.maxLeadTimeDays ?? matData.max_lead_time_days ?? 2)
      };

      const { data, error } = await supabase
        .from('raw_materials')
        .insert(payload)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const formatted = formatMaterial(data[0]);
        setMaterials(prev => [...prev, formatted]);
        logAudit({
          action: 'CREATE_MATERIAL',
          category: 'INVENTORI',
          description: `Bahan baku baru ditambahkan ke Supabase: ${formatted.name} (Stok: ${formatted.currentStock} ${formatted.unit}, Rp ${formatted.unitPrice})`,
          details: formatted
        });
        showToast(`Bahan baku "${formatted.name}" berhasil ditambahkan ke database!`, 'success');
        return formatted;
      }
    } catch (err) {
      console.error('Error adding material to Supabase:', err);
      showToast('Gagal menambah bahan ke Supabase: ' + err.message, 'error');
      throw err;
    }
  };

  const updateMaterial = async (materialId, matData) => {
    try {
      const payload = {
        name: matData.name,
        base_unit: matData.unit || matData.base_unit,
        current_stock: Number(matData.currentStock ?? matData.current_stock),
        unit_price: Number(matData.unitPrice ?? matData.unit_price),
        avg_daily_usage: Number(matData.avgDailyUsage ?? matData.avg_daily_usage),
        max_daily_usage: Number(matData.maxDailyUsage ?? matData.max_daily_usage),
        avg_lead_time_days: Number(matData.avgLeadTimeDays ?? matData.avg_lead_time_days),
        max_lead_time_days: Number(matData.maxLeadTimeDays ?? matData.max_lead_time_days),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('raw_materials')
        .update(payload)
        .eq('id', materialId)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const formatted = formatMaterial(data[0]);
        setMaterials(prev => prev.map(m => m.id === materialId ? formatted : m));
        logAudit({
          action: 'UPDATE_MATERIAL',
          category: 'INVENTORI',
          description: `Data bahan baku diperbarui di Supabase: ${formatted.name}`,
          details: formatted
        });
        showToast(`Bahan baku "${formatted.name}" berhasil diperbarui di database!`, 'success');
        return formatted;
      }
    } catch (err) {
      console.error('Error updating material in Supabase:', err);
      showToast('Gagal memperbarui bahan di Supabase: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteMaterial = async (materialId) => {
    try {
      const target = materials.find(m => m.id === materialId);
      const { error } = await supabase
        .from('raw_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      setMaterials(prev => prev.filter(m => m.id !== materialId));
      logAudit({
        action: 'DELETE_MATERIAL',
        category: 'INVENTORI',
        description: `Bahan baku dihapus dari Supabase: ${target?.name || materialId}`,
        details: { id: materialId, name: target?.name }
      });
      showToast(`Bahan baku "${target?.name || ''}" berhasil dihapus dari database.`, 'info');
    } catch (err) {
      console.error('Error deleting material in Supabase:', err);
      showToast('Gagal menghapus bahan: ' + err.message, 'error');
      throw err;
    }
  };

  // Stock In
  const addMaterialStock = async ({ materialId, qty, unitPrice, isCredit, supplierName }) => {
    const mat = materials.find(m => m.id === materialId);
    if (!mat) return;

    const addedQty = Number(qty) || 0;
    const price = Number(unitPrice) || mat.unitPrice;
    const totalCost = addedQty * price;
    const newStock = Number(mat.currentStock || 0) + addedQty;

    try {
      // 1. Update stock in Supabase
      const { data: updatedMat, error: errStock } = await supabase
        .from('raw_materials')
        .update({
          current_stock: newStock,
          unit_price: price,
          updated_at: new Date().toISOString()
        })
        .eq('id', materialId)
        .select();

      if (errStock) throw errStock;

      // 2. Insert into inventory_transactions log
      await supabase.from('inventory_transactions').insert({
        raw_material_id: materialId,
        transaction_type: 'IN',
        quantity: addedQty,
        unit_price: price,
        notes: `Penerimaan Stok (${supplierName || 'Vendor'}) - ${isCredit ? 'Kredit' : 'Tunai'}`
      });

      // 3. Insert Journal Entry & Items
      const today = new Date().toISOString().split('T')[0];
      const creditAccountCode = isCredit ? '201' : '101';
      const refNumber = `IN-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: jEntry, error: errJ } = await supabase
        .from('journal_entries')
        .insert({
          entry_date: today,
          reference_number: refNumber,
          description: `Pembelian Bahan ${mat.name} (${addedQty} ${mat.unit}) - ${isCredit ? 'Kredit Vendor' : 'Tunai'}`
        })
        .select();

      if (jEntry && jEntry[0]) {
        await supabase.from('journal_items').insert([
          { journal_entry_id: jEntry[0].id, account_code: '102', debit: totalCost, credit: 0 },
          { journal_entry_id: jEntry[0].id, account_code: creditAccountCode, debit: 0, credit: totalCost }
        ]);
      }

      // Update local state
      if (updatedMat && updatedMat[0]) {
        setMaterials(prev => prev.map(m => m.id === materialId ? formatMaterial(updatedMat[0]) : m));
      }

      logAudit({
        action: 'STOCK_IN',
        category: 'INVENTORI',
        description: `Penerimaan Stok Bahan: ${mat.name} (+${addedQty} ${mat.unit}, Rp ${totalCost.toLocaleString('id-ID')}) tersimpan ke Supabase`,
        details: { materialId, materialName: mat.name, qty: addedQty, unitPrice: price, totalCost, supplier: supplierName || 'Vendor', isCredit }
      });

      showToast(`Stok ${mat.name} bertambah ${addedQty} ${mat.unit}. Tersimpan langsung ke database Supabase!`, 'success');
      fetchAllFromSupabase();
    } catch (err) {
      console.error('Error adding stock in Supabase:', err);
      showToast('Gagal mencatat penerimaan stok: ' + err.message, 'error');
    }
  };

  // ==========================================
  // CRUD PRODUK & VARIAN SUPABASE
  // ==========================================
  const addProduct = async (prodData) => {
    try {
      // 1. Insert product
      const { data: newProd, error: errProd } = await supabase
        .from('products')
        .insert({
          name: prodData.name,
          code: prodData.code || `PROD-${Date.now().toString(36).toUpperCase()}`,
          category: prodData.category || 'Kopi'
        })
        .select();

      if (errProd) throw errProd;

      const createdProduct = newProd[0];
      const createdVariants = [];

      // 2. Insert variants
      if (prodData.variants && prodData.variants.length > 0) {
        const variantsToInsert = prodData.variants.map(v => ({
          product_id: createdProduct.id,
          size_label: v.sizeLabel || v.size_label || '250 ml (Cup)',
          size_ml: Number(v.sizeMl || v.size_ml || 250),
          selling_price: Number(v.sellingPrice || v.price || 0)
        }));

        const { data: newVars, error: errVars } = await supabase
          .from('product_variants')
          .insert(variantsToInsert)
          .select();

        if (errVars) throw errVars;
        if (newVars) createdVariants.push(...newVars);
      }

      logAudit({
        action: 'CREATE_PRODUCT',
        category: 'PRODUKSI',
        description: `Produk baru ditambahkan ke Supabase: ${createdProduct.name} (${createdVariants.length} varian)`,
        details: { product: createdProduct, variants: createdVariants }
      });

      showToast(`Produk "${createdProduct.name}" berhasil dibuat di database!`, 'success');
      await fetchAllFromSupabase();
      return createdProduct;
    } catch (err) {
      console.error('Error creating product in Supabase:', err);
      showToast('Gagal membuat produk di Supabase: ' + err.message, 'error');
      throw err;
    }
  };

  const updateProduct = async (productId, prodData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: prodData.name,
          category: prodData.category
        })
        .eq('id', productId)
        .select();

      if (error) throw error;

      showToast(`Produk berhasil diperbarui di database!`, 'success');
      await fetchAllFromSupabase();
      return data[0];
    } catch (err) {
      console.error('Error updating product in Supabase:', err);
      showToast('Gagal update produk: ' + err.message, 'error');
      throw err;
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const target = products.find(p => p.id === productId);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      logAudit({
        action: 'DELETE_PRODUCT',
        category: 'PRODUKSI',
        description: `Produk dihapus dari Supabase: ${target?.name || productId}`,
        details: { id: productId, name: target?.name }
      });

      showToast(`Produk "${target?.name || ''}" berhasil dihapus.`, 'info');
      await fetchAllFromSupabase();
    } catch (err) {
      console.error('Error deleting product in Supabase:', err);
      showToast('Gagal menghapus produk: ' + err.message, 'error');
      throw err;
    }
  };

  // ==========================================
  // BOM RECIPES (TAKAREN BAHAN) SUPABASE
  // ==========================================
  const deleteBOMItem = async (variantId, materialId) => {
    try {
      const targetMat = materials.find(m => m.id === materialId);
      const { error } = await supabase
        .from('bom_recipes')
        .delete()
        .eq('variant_id', variantId)
        .eq('raw_material_id', materialId);

      if (error) throw error;

      setBom(prev => prev.filter(b =>
        !((b.variantId === variantId || b.variant_id === variantId) &&
          (b.materialId === materialId || b.raw_material_id === materialId))
      ));

      logAudit({
        action: 'BOM_DELETE_ITEM',
        category: 'PRODUKSI',
        description: `Bahan ${targetMat?.name || materialId} dihapus dari formula BOM varian`,
        details: { variantId, materialId }
      });

      showToast(`Bahan baku berhasil dihapus dari resep.`, 'info');
    } catch (err) {
      console.error('Error deleting BOM item in Supabase:', err);
      showToast('Gagal menghapus bahan dari resep: ' + err.message, 'error');
    }
  };

  const saveVariantRecipe = async (variantId, recipeItems, variantLabel = '') => {
    // recipeItems is an array of { materialId, qty }
    try {
      // 1. Filter item yang valid (qty > 0)
      const validItems = (recipeItems || []).filter(item => Number(item.qty) > 0);
      const activeMaterialIds = validItems.map(item => item.materialId);

      // 2. Hapus bahan yang sebelumnya ada di DB tapi sekarang dihapus/tidak ada di resep
      const existingForVariant = bom.filter(b => (b.variantId === variantId || b.variant_id === variantId));
      const toDelete = existingForVariant.filter(b => !activeMaterialIds.includes(b.materialId || b.raw_material_id));

      for (const item of toDelete) {
        const matId = item.materialId || item.raw_material_id;
        await supabase
          .from('bom_recipes')
          .delete()
          .eq('variant_id', variantId)
          .eq('raw_material_id', matId);
      }

      // 3. Simpan atau perbarui setiap bahan yang aktif
      for (const item of validItems) {
        const qtyNum = Number(item.qty);
        const exists = existingForVariant.some(b => (b.materialId === item.materialId || b.raw_material_id === item.materialId));

        if (exists) {
          await supabase
            .from('bom_recipes')
            .update({ qty_required: qtyNum })
            .eq('variant_id', variantId)
            .eq('raw_material_id', item.materialId);
        } else {
          await supabase
            .from('bom_recipes')
            .insert({
              variant_id: variantId,
              raw_material_id: item.materialId,
              qty_required: qtyNum
            });
        }
      }

      // 4. Update local BOM state
      setBom(prev => {
        const others = prev.filter(b => !(b.variantId === variantId || b.variant_id === variantId));
        const newEntries = validItems.map(item => ({
          variantId,
          variant_id: variantId,
          materialId: item.materialId,
          raw_material_id: item.materialId,
          qty: Number(item.qty),
          qty_required: Number(item.qty)
        }));
        return [...others, ...newEntries];
      });

      logAudit({
        action: 'BOM_RECIPE_SAVED',
        category: 'PRODUKSI',
        description: `Formula BOM varian ${variantLabel || variantId} berhasil disimpan (${validItems.length} bahan baku)`,
        details: { variantId, items: validItems }
      });

      showToast(`Resep formula ${variantLabel ? `"${variantLabel}" ` : ''}berhasil disimpan ke Supabase!`, 'success');
      return true;
    } catch (err) {
      console.error('Error saving variant recipe to Supabase:', err);
      showToast('Gagal menyimpan formula resep: ' + err.message, 'error');
      throw err;
    }
  };

  const updateBOM = async (variantId, materialId, newQty) => {
    const qtyNum = Number(newQty);
    try {
      const existing = bom.find(b =>
        (b.variantId === variantId || b.variant_id === variantId) &&
        (b.materialId === materialId || b.raw_material_id === materialId)
      );

      if (qtyNum <= 0) {
        if (existing) {
          await supabase
            .from('bom_recipes')
            .delete()
            .eq('variant_id', variantId)
            .eq('raw_material_id', materialId);
        }
        setBom(prev => prev.filter(b =>
          !((b.variantId === variantId || b.variant_id === variantId) &&
            (b.materialId === materialId || b.raw_material_id === materialId))
        ));
      } else {
        if (existing) {
          await supabase
            .from('bom_recipes')
            .update({ qty_required: qtyNum })
            .eq('variant_id', variantId)
            .eq('raw_material_id', materialId);
        } else {
          await supabase
            .from('bom_recipes')
            .insert({
              variant_id: variantId,
              raw_material_id: materialId,
              qty_required: qtyNum
            });
        }

        setBom(prev => {
          const found = prev.find(b => (b.variantId === variantId || b.variant_id === variantId) && (b.materialId === materialId || b.raw_material_id === materialId));
          if (found) {
            return prev.map(b => (b.variantId === variantId || b.variant_id === variantId) && (b.materialId === materialId || b.raw_material_id === materialId) ? { ...b, qty: qtyNum, qty_required: qtyNum } : b);
          } else {
            return [...prev, { variantId, variant_id: variantId, materialId, raw_material_id: materialId, qty: qtyNum, qty_required: qtyNum }];
          }
        });
      }

      const targetMat = materials.find(m => m.id === materialId);
      logAudit({
        action: 'BOM_UPDATE',
        category: 'PRODUKSI',
        description: `Formula BOM diperbarui di Supabase: Varian ${variantId} -> ${targetMat?.name || materialId}: ${qtyNum} ${targetMat?.unit || ''}`,
        details: { variantId, materialId, qty: qtyNum }
      });

      showToast(`Resep BOM berhasil disimpan ke database Supabase!`, 'info');
    } catch (err) {
      console.error('Error updating BOM in Supabase:', err);
      showToast('Gagal update BOM di Supabase: ' + err.message, 'error');
    }
  };

  // ==========================================
  // ORDERS & POS TRANSACTIONS SUPABASE
  // ==========================================
  const createOrder = async (orderData) => {
    try {
      const orderNum = orderData.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

      let totalAmt = 0;
      let totalHPP = 0;
      orderData.items.forEach(item => {
        const price = Number(item.unitPrice) || 0;
        const qty = Number(item.qty || item.quantity) || 0;
        totalAmt += price * qty;
        totalHPP += calculateVariantHPP(item.variantId) * qty;
      });

      // 1. Insert order into Supabase
      const { data: newOrderData, error: errOrder } = await supabase
        .from('orders')
        .insert({
          order_number: orderNum,
          customer_name: orderData.customerName || 'Pelanggan Umum',
          segment: orderData.segment || 'POS',
          delivery_date: orderData.deliveryDate || new Date().toISOString().split('T')[0],
          status: orderData.status || 'PENDING',
          payment_status: orderData.paymentStatus || 'LUNAS',
          payment_method: orderData.paymentMethod || 'CASH',
          total_amount: totalAmt,
          total_hpp: totalHPP,
          notes: orderData.notes || ''
        })
        .select();

      if (errOrder) throw errOrder;
      const createdOrder = newOrderData[0];

      // 2. Insert order items
      if (orderData.items && orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map(item => {
          const uPrice = Number(item.unitPrice) || 0;
          const uQty = Number(item.qty || item.quantity) || 1;
          const uHpp = calculateVariantHPP(item.variantId);
          return {
            order_id: createdOrder.id,
            variant_id: item.variantId,
            sugar_level: item.sugarLevel || 'Normal',
            quantity: uQty,
            unit_price: uPrice,
            unit_hpp: uHpp,
            subtotal: uPrice * uQty,
            subtotal_hpp: uHpp * uQty
          };
        });

        await supabase.from('order_items').insert(itemsToInsert);
      }

      logAudit({
        action: 'ORDER_CREATE',
        category: 'PENJUALAN',
        description: `Order Baru ${orderNum} (${createdOrder.customer_name}) dibuat: ${orderData.items.length} item, Rp ${totalAmt.toLocaleString('id-ID')} tersimpan di Supabase`,
        details: { orderId: createdOrder.id, orderNumber: orderNum, totalAmount: totalAmt }
      });

      if (createdOrder.status === 'COMPLETED') {
        await completeOrder(createdOrder.id);
      } else {
        showToast(`Pesanan ${orderNum} berhasil tersimpan ke database!`, 'info');
      }

      await fetchAllFromSupabase();

      // Kembalikan objek formatted agar kompatibel dengan ReceiptModal
      return {
        id: createdOrder.id,
        orderNumber: createdOrder.order_number,
        customerName: createdOrder.customer_name,
        segment: createdOrder.segment,
        deliveryDate: createdOrder.delivery_date,
        status: createdOrder.status,
        paymentStatus: createdOrder.payment_status,
        paymentMethod: createdOrder.payment_method,
        totalAmount: Number(createdOrder.total_amount),
        totalHPP: Number(createdOrder.total_hpp),
        notes: createdOrder.notes || '',
        items: orderData.items.map(item => ({
          ...item,
          qty: Number(item.qty || item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
        }))
      };
    } catch (err) {
      console.error('Error creating order in Supabase:', err);
      showToast('Gagal membuat pesanan di Supabase: ' + err.message, 'error');
      throw err;
    }
  };

  const completeOrder = async (orderId) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      if (!targetOrder || targetOrder.status === 'COMPLETED') return;

      // Deduct materials
      const materialDeductions = {};
      targetOrder.items.forEach(item => {
        const itemQty = Number(item.qty || item.quantity) || 0;
        const recipe = bom.filter(b => b.variantId === item.variantId || b.variant_id === item.variantId);
        recipe.forEach(b => {
          const matId = b.materialId || b.raw_material_id;
          const reqQty = Number(b.qty || b.qty_required || 0) * itemQty;
          materialDeductions[matId] = (materialDeductions[matId] || 0) + reqQty;
        });
      });

      // Update materials stock in Supabase
      for (const [matId, deductQty] of Object.entries(materialDeductions)) {
        const mat = materials.find(m => m.id === matId);
        if (mat) {
          const newStock = Math.max(0, (mat.currentStock || 0) - deductQty);
          await supabase.from('raw_materials').update({ current_stock: newStock }).eq('id', matId);
          await supabase.from('inventory_transactions').insert({
            raw_material_id: matId,
            transaction_type: 'OUT',
            quantity: deductQty,
            notes: `Deduksi BOM Order ${targetOrder.orderNumber}`
          });
        }
      }

      // Update Order Status in Supabase
      await supabase.from('orders').update({ status: 'COMPLETED' }).eq('id', orderId);

      // Post Double-Entry Journal
      const today = new Date().toISOString().split('T')[0];
      const { data: jEntry } = await supabase.from('journal_entries').insert({
        entry_date: today,
        reference_number: targetOrder.orderNumber,
        description: `Penjualan Sales Order ${targetOrder.orderNumber} (${targetOrder.customerName})`
      }).select();

      if (jEntry && jEntry[0]) {
        await supabase.from('journal_items').insert([
          { journal_entry_id: jEntry[0].id, account_code: '101', debit: targetOrder.totalAmount, credit: 0 },
          { journal_entry_id: jEntry[0].id, account_code: '401', debit: 0, credit: targetOrder.totalAmount },
          { journal_entry_id: jEntry[0].id, account_code: '501', debit: targetOrder.totalHPP, credit: 0 },
          { journal_entry_id: jEntry[0].id, account_code: '102', debit: 0, credit: targetOrder.totalHPP }
        ]);
      }

      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch (e) {
        // ignore
      }

      logAudit({
        action: 'ORDER_COMPLETE',
        category: 'PENJUALAN',
        description: `Order ${targetOrder.orderNumber} diselesaikan. Deduksi stok & auto-journal tercatat di Supabase.`,
        details: { orderId, orderNumber: targetOrder.orderNumber, totalAmount: targetOrder.totalAmount }
      });

      showToast(`Order ${targetOrder.orderNumber} selesai! Deduksi stok & auto-jurnal aktif.`, 'success');
      await fetchAllFromSupabase();
    } catch (err) {
      console.error('Error completing order in Supabase:', err);
      showToast('Gagal menyelesaikan order: ' + err.message, 'error');
    }
  };

  // ==========================================
  // MARK ORDER AS PAID (LUNAS)
  // ==========================================
  const markOrderPaid = async (orderId, newPaymentMethod = null) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      if (!targetOrder) return;
      if (targetOrder.paymentStatus === 'LUNAS') {
        showToast('Order ini sudah berstatus LUNAS.', 'info');
        return;
      }

      const updateData = { payment_status: 'LUNAS' };
      if (newPaymentMethod) updateData.payment_method = newPaymentMethod;

      // 1. Update payment_status di Supabase
      const { error: errUpdate } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (errUpdate) throw errUpdate;

      // 2. Auto-journal: Kas Masuk (jika belum ada jurnal pelunasan)
      const today = new Date().toISOString().split('T')[0];
      const refNum = `PAY-${targetOrder.orderNumber}`;
      const { data: jEntry } = await supabase.from('journal_entries').insert({
        entry_date: today,
        reference_number: refNum,
        description: `Pelunasan Pembayaran Order ${targetOrder.orderNumber} (${targetOrder.customerName})`
      }).select();

      if (jEntry && jEntry[0]) {
        // Debit Kas/Bank, Credit Piutang Usaha (jika ada) atau langsung Revenue
        await supabase.from('journal_items').insert([
          { journal_entry_id: jEntry[0].id, account_code: '101', debit: targetOrder.totalAmount, credit: 0 },
          { journal_entry_id: jEntry[0].id, account_code: '401', debit: 0, credit: targetOrder.totalAmount }
        ]);
      }

      try { confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } }); } catch (e) {}

      logAudit({
        action: 'ORDER_PAID',
        category: 'KEUANGAN',
        description: `Pembayaran Order ${targetOrder.orderNumber} (${targetOrder.customerName}) dikonfirmasi LUNAS. Rp ${targetOrder.totalAmount.toLocaleString('id-ID')}. Jurnal kas masuk otomatis tercatat.`,
        details: { orderId, orderNumber: targetOrder.orderNumber, totalAmount: targetOrder.totalAmount }
      });

      showToast(`✅ Order ${targetOrder.orderNumber} dikonfirmasi LUNAS!`, 'success');
      await fetchAllFromSupabase();
    } catch (err) {
      console.error('Error marking order as paid:', err);
      showToast('Gagal konfirmasi pembayaran: ' + err.message, 'error');
    }
  };

  const addOpex = async (opexData) => {
    try {
      const amount = Number(opexData.amount) || 0;
      const today = new Date().toISOString().split('T')[0];

      // 1. Insert into opex_expenses
      const { data: newOpexData, error: errOpex } = await supabase
        .from('opex_expenses')
        .insert({
          expense_date: opexData.date || today,
          category: opexData.category,
          description: opexData.description,
          amount: amount,
          payment_account_code: opexData.paymentAccountCode || '101'
        })
        .select();

      if (errOpex) throw errOpex;

      // 2. Insert auto-journal
      const refNumber = `OPEX-${Math.floor(100 + Math.random() * 900)}`;
      const { data: jEntry } = await supabase.from('journal_entries').insert({
        entry_date: opexData.date || today,
        reference_number: refNumber,
        description: `Pengeluaran OPEX: ${opexData.category} (${opexData.description})`
      }).select();

      if (jEntry && jEntry[0]) {
        await supabase.from('journal_items').insert([
          { journal_entry_id: jEntry[0].id, account_code: '601', debit: amount, credit: 0 },
          { journal_entry_id: jEntry[0].id, account_code: opexData.paymentAccountCode || '101', debit: 0, credit: amount }
        ]);
      }

      logAudit({
        action: 'OPEX_ADD',
        category: 'KEUANGAN',
        description: `Beban Operasional Rp ${amount.toLocaleString('id-ID')} (${opexData.category}: ${opexData.description}) tersimpan di Supabase`,
        details: opexData
      });

      showToast(`Biaya OPEX Rp ${amount.toLocaleString('id-ID')} dicatat ke database Supabase!`, 'success');
      await fetchAllFromSupabase();
    } catch (err) {
      console.error('Error adding OPEX in Supabase:', err);
      showToast('Gagal mencatat OPEX: ' + err.message, 'error');
    }
  };

  // Financial calculations - Bersumber dari Buku Besar Jurnal Umum (General Ledger)
  const calculateFinancials = () => {
    let journalRevenue = 0;
    let journalBPP = 0;
    let journalOpex = 0;
    let hasJournalData = false;

    if (journal && journal.length > 0) {
      journal.forEach(entry => {
        (entry.items || []).forEach(item => {
          const code = String(item.accountCode || item.account_code || '');
          const debit = Number(item.debit) || 0;
          const credit = Number(item.credit) || 0;

          if (code === '401') {
            hasJournalData = true;
            journalRevenue += (credit - debit);
          } else if (code === '501') {
            hasJournalData = true;
            journalBPP += (debit - credit);
          } else if (code === '601') {
            hasJournalData = true;
            journalOpex += (debit - credit);
          }
        });
      });
    }

    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const orderRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const orderHPP = completedOrders.reduce((sum, o) => sum + (o.totalHPP || 0), 0);
    const orderOpex = opex.reduce((sum, op) => sum + (op.amount || 0), 0);

    const totalRevenue = hasJournalData ? journalRevenue : orderRevenue;
    const totalHPP = hasJournalData ? journalBPP : orderHPP;
    const totalOpex = hasJournalData ? (journalOpex + orderOpex) : orderOpex;
    const grossProfit = totalRevenue - totalHPP;
    const netProfit = grossProfit - totalOpex;

    const avgMarginPerCup = 10500;
    const bepCups = Math.ceil(totalOpex / avgMarginPerCup) || 0;
    const bepBatches = Math.ceil(bepCups / 14) || 0;

    return {
      totalRevenue,
      totalHPP,
      grossProfit,
      totalOpex,
      netProfit,
      bepCups,
      bepBatches,
      marginPercent: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0
    };
  };

  const resetData = async () => {
    await fetchAllFromSupabase();
    showToast('Data berhasil disinkronisasi ulang langsung dari Supabase!', 'info');
  };

  return (
    <ERPContext.Provider
      value={{
        userRole,
        setUserRole,
        activeTab,
        setActiveTab,
        toast,
        showToast,
        coa,
        materials,
        setMaterials,
        products,
        bom,
        orders,
        opex,
        journal,
        auditLogs,
        logAudit,
        isLoading,
        isSyncing,
        fetchAllFromSupabase,
        calculateSSAndROP,
        calculateVariantHPP,
        getVariantsWithHPP,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        addProduct,
        updateProduct,
        deleteProduct,
        completeOrder,
        markOrderPaid,
        createOrder,
        addMaterialStock,
        addOpex,
        updateBOM,
        deleteBOMItem,
        saveVariantRecipe,
        calculateFinancials,
        resetData
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => useContext(ERPContext);
