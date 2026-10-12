import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../context/ERPContext';
import {
  ShoppingCart,
  Coffee,
  Plus,
  Minus,
  CheckCircle2,
  QrCode,
  DollarSign
} from 'lucide-react';

export const POSModule = ({ onShowReceipt }) => {
  const navigate = useNavigate();
  const { products, getVariantsWithHPP, createOrder } = useERP();

  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '');
  const [selectedSugar, setSelectedSugar] = useState('Normal');
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [customerName, setCustomerName] = useState('Pelanggan POS');

  const variants = getVariantsWithHPP();
  const currentProduct = products.find(p => p.id === selectedProduct) || products[0];

  const isOneLiterVariant = (sizeLabel, sizeMl) => {
    if (!sizeLabel && !sizeMl) return false;
    const labelLower = (sizeLabel || '').toLowerCase();
    return labelLower.includes('1 liter') || labelLower.includes('1l') || sizeMl === 1000;
  };

  const addToCart = (variant) => {
    setCart(prev => {
      const is1L = isOneLiterVariant(variant.sizeLabel, variant.sizeMl);
      const existingIndex = prev.findIndex(
        item => item.variantId === variant.id && item.sugarLevel === selectedSugar
      );
      if (existingIndex > -1) {
        return prev.map((item, idx) => {
          if (idx !== existingIndex) return item;
          const nextQty = item.qty + 1;
          const nextPrice = is1L ? (nextQty >= 2 ? 55000 : 60000) : (item.defaultPrice || variant.sellingPrice || variant.price || 0);
          return {
            ...item,
            qty: nextQty,
            unitPrice: nextPrice
          };
        });
      } else {
        const initialPrice = is1L ? 60000 : (variant.sellingPrice || variant.price || 0);
        return [
          ...prev,
          {
            variantId: variant.id,
            productName: currentProduct.name,
            sizeLabel: variant.sizeLabel,
            sizeMl: variant.sizeMl,
            sugarLevel: selectedSugar,
            defaultPrice: variant.sellingPrice || variant.price || 0,
            unitPrice: initialPrice,
            qty: 1
          }
        ];
      }
    });
  };

  const updateCartQty = (index, delta) => {
    setCart(prev => {
      const targetItem = prev[index];
      if (!targetItem) return prev;
      const nextQty = targetItem.qty + delta;
      if (nextQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return prev.map((item, i) => {
        if (i !== index) return item;
        const is1L = isOneLiterVariant(item.sizeLabel, item.sizeMl);
        const nextPrice = is1L ? (nextQty >= 2 ? 55000 : 60000) : item.defaultPrice;
        return {
          ...item,
          qty: nextQty,
          unitPrice: nextPrice
        };
      });
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const newOrder = await createOrder({
        orderNumber: `POS-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: customerName.trim() || 'Pelanggan POS Direct',
        segment: 'POS',
        deliveryDate: new Date().toISOString().split('T')[0],
        status: 'COMPLETED',
        paymentStatus: 'LUNAS',
        paymentMethod: paymentMethod,
        items: cart,
        notes: 'Penjualan POS Langsung Kasir'
      });

      setCart([]);
      // Redirect ke halaman orders, lalu tampilkan receipt
      navigate('/orders');
      if (newOrder) onShowReceipt(newOrder);
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Product Selection (7 cols) */}
      <div className="lg:col-span-7 space-y-4">

        {/* Product Category Tabs */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProduct(p.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  border: '1.5px solid',
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                  background: selectedProduct === p.id ? '#0284C7' : '#F0F9FF',
                  color: selectedProduct === p.id ? '#FFFFFF' : '#0369A1',
                  borderColor: selectedProduct === p.id ? '#0284C7' : '#BAE6FD',
                  boxShadow: selectedProduct === p.id ? '0 4px 12px rgba(2,132,199,0.25)' : 'none',
                }}
              >
                <Coffee style={{ width: '14px', height: '14px' }} />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sugar Level */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
            Kustomisasi Gula (Sugar Level)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.625rem' }}>
            {['Normal', 'Less Sugar', 'No Sugar'].map(level => (
              <button
                key={level}
                onClick={() => setSelectedSugar(level)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: '1.5px solid',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  background: selectedSugar === level ? '#E0F2FE' : '#F8FAFC',
                  color: selectedSugar === level ? '#0284C7' : '#64748B',
                  borderColor: selectedSugar === level ? '#7DD3FC' : '#E2E8F0',
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Product Variant Cards */}
        {currentProduct && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: '1rem' }}>
            {currentProduct.variants.map(v => (
              <div
                key={v.id}
                className="glass-card"
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem', gap: '1rem' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7', fontFamily: 'var(--font-mono)' }}>
                      {v.sizeLabel}
                    </span>
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 700,
                      background: '#F0F9FF', color: '#0369A1',
                      border: '1px solid #BAE6FD',
                      padding: '0.15rem 0.5rem', borderRadius: '9999px'
                    }}>
                      {v.sizeMl} ml
                    </span>
                  </div>
                  <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>{currentProduct.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Opsi: {selectedSugar}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 900, color: '#0F172A' }}>
                      Rp {(isOneLiterVariant(v.sizeLabel, v.sizeMl) ? 60000 : (v.sellingPrice || v.price || 0)).toLocaleString('id-ID')}
                    </span>
                    {isOneLiterVariant(v.sizeLabel, v.sizeMl) && (
                      <p style={{ fontSize: '0.6875rem', color: '#16A34A', fontWeight: 700, margin: '0.15rem 0 0 0' }}>
                        Beli ≥2: Rp 55.000/pcs
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart({ ...v, sellingPrice: isOneLiterVariant(v.sizeLabel, v.sizeMl) ? 60000 : (v.sellingPrice || v.price || 0) })}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.45rem 0.9rem',
                      background: 'linear-gradient(135deg,#0284C7,#0369A1)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.625rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 3px 10px rgba(2,132,199,0.3)',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 18px rgba(2,132,199,0.45)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 3px 10px rgba(2,132,199,0.3)'}
                  >
                    <Plus style={{ width: '14px', height: '14px' }} />
                    Tambah
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Cart & Checkout (5 cols) */}
      <div className="lg:col-span-5 glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '600px', padding: '1.5rem' }}>
        <div>
          {/* Cart Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1.5px solid #E2E8F0', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart style={{ width: '18px', height: '18px', color: '#0284C7' }} />
              <h3 style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9375rem' }}>Keranjang Kasir</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'var(--font-mono)', background: '#F0F9FF', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid #BAE6FD' }}>
              {cart.reduce((sum, item) => sum + item.qty, 0)} items
            </span>
          </div>

          {/* Customer Name */}
          <input
            type="text"
            placeholder="Nama Pelanggan / Atas Nama..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}
          />

          {/* Cart Items */}
          <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94A3B8' }}>
                <Coffee style={{ width: '40px', height: '40px', margin: '0 auto 0.75rem', opacity: 0.35 }} />
                <p style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Keranjang masih kosong.</p>
                <p style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Pilih varian di sebelah kiri.</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={`${item.variantId}-${item.sugarLevel}-${index}`}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#F8FAFC',
                    borderRadius: '0.75rem',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.productName}
                    </h5>
                    <p style={{ fontSize: '0.6875rem', color: '#64748B', fontFamily: 'var(--font-mono)', marginTop: '0.125rem' }}>
                      {item.sizeLabel} · <span style={{ color: '#0284C7', fontWeight: 700 }}>{item.sugarLevel}</span>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0369A1' }}>
                        Rp {(item.unitPrice * item.qty).toLocaleString('id-ID')}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        (@Rp {item.unitPrice.toLocaleString('id-ID')})
                      </span>
                    </div>
                    {isOneLiterVariant(item.sizeLabel, item.sizeMl) && (
                      <div style={{ marginTop: '0.3rem' }}>
                        {item.qty >= 2 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: '#15803D',
                            background: '#DCFCE7',
                            border: '1px solid #86EFAC',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '0.375rem'
                          }}>
                            Harga Multi: Rp 55.000/pcs
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: '#0284C7',
                            background: '#F0F9FF',
                            border: '1px solid #BAE6FD',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '0.375rem'
                          }}>
                            Beli ≥2 pcs dapat Rp 55.000/pcs
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <button
                      onClick={() => updateCartQty(index, -1)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '0.5rem',
                        background: '#F0F9FF', border: '1px solid #BAE6FD',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#0284C7'
                      }}
                    >
                      <Minus style={{ width: '12px', height: '12px' }} />
                    </button>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.875rem', color: '#0F172A', width: '24px', textAlign: 'center' }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateCartQty(index, 1)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '0.5rem',
                        background: '#0284C7', border: '1px solid #0284C7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#FFFFFF'
                      }}
                    >
                      <Plus style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Footer */}
        <div style={{ paddingTop: '1.25rem', borderTop: '1.5px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
              Metode Pembayaran
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              {[
                { key: 'QRIS', label: 'QRIS Instant', Icon: QrCode },
                { key: 'CASH', label: 'Tunai / Cash', Icon: DollarSign },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.625rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: '1.5px solid',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    background: paymentMethod === key ? '#E0F2FE' : '#F8FAFC',
                    color: paymentMethod === key ? '#0284C7' : '#64748B',
                    borderColor: paymentMethod === key ? '#38BDF8' : '#E2E8F0',
                  }}
                >
                  <Icon style={{ width: '15px', height: '15px' }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9375rem' }}>Total Pembayaran</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.375rem', color: '#0284C7' }}>
              Rp {cartTotal.toLocaleString('id-ID')}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.875rem',
              borderRadius: '0.875rem',
              fontSize: '0.9375rem',
              fontWeight: 800,
              border: 'none',
              cursor: (cart.length === 0 || isProcessing) ? 'not-allowed' : 'pointer',
              opacity: (cart.length === 0 || isProcessing) ? 0.55 : 1,
              background: isProcessing
                ? 'linear-gradient(135deg, #4B9B6F, #3D7A58)'
                : 'linear-gradient(135deg, #16A34A, #15803D)',
              color: '#FFFFFF',
              boxShadow: cart.length > 0 && !isProcessing ? '0 4px 16px rgba(22,163,74,0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCircle2 style={{ width: '18px', height: '18px' }} />
            {isProcessing ? 'Memproses...' : 'Bayar & Potong Stok BOM'}
          </button>
        </div>
      </div>
    </div>
  );
};
