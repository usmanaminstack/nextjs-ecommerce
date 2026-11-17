'use client';

import { useState, useEffect, useCallback } from 'react';
import CryptoJS from 'crypto-js';
import {
  Settings, ShoppingCart, ShoppingBag, Trash2, Plus, Minus, X, Lock,
  CheckCircle2, AlertCircle, ArrowRight, Copy, Check, ExternalLink,
  ShieldCheck, Sparkles, Layers, RefreshCw, LayoutTemplate
} from 'lucide-react';
import KuickPayCheckoutModal from './components/KuickPayCheckoutModal';
import KuickPayCheckoutInline from './components/KuickPayCheckoutInline';

const LogoMark = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" className="brand-mark">
    <polygon points="18,4 18,18 6,30 6,16" fill="#1230C4" />
    <polygon points="20,6 20,34 32,22 32,18" fill="#2F8FEF" />
    <polygon points="30,10 34,14 30,14" fill="#7CC0FF" />
  </svg>
);

const PRESETS = {
  local: {
    name: 'Local',
    merchantName: 'KP Local Sandbox',
    baseUrl: 'https://prod-api.kuickpay.com',
    checkoutUrl: 'https://checkout.kuickpay.com',
    checkoutMode: 'modal', // 'modal' | 'inline' | 'redirect'
    companyId: '10010',
    securedKey: 'JNyb6+qG3UFJ2Gt6tnJxSyxgtuduP4gJEzx/KbXC0YA=',
    returnUrl: 'https://nextjs-ecommerce-umber-beta.vercel.app/kuickpay-return',
    debugRedirectUrl: '',
    manualMode: false,
  },
  uat: {
    name: 'UAT',
    merchantName: 'KP UAT Hub',
    baseUrl: 'https://sandbox-api.kuickpay.com',
    checkoutUrl: 'https://uatpayments.kuickpay.com/',
    checkoutMode: 'modal',
    companyId: '02429',
    securedKey: 'xWX+A8qbYkLgHf3e/pu6PZiycOGc0C/YXOr3XislvxI=',
    returnUrl: 'https://nextjs-ecommerce-umber-beta.vercel.app/kuickpay-return',
    debugRedirectUrl: '',
    manualMode: false,
  },
  prod: {
    name: 'Prod',
    merchantName: 'KP Enterprise',
    baseUrl: 'https://prod-api.kuickpay.com',
    checkoutUrl: 'https://checkout.kuickpay.com',
    checkoutMode: 'modal',
    companyId: '10010',
    securedKey: 'JNyb6+qG3UFJ2Gt6tnJxSyxgtuduP4gJEzx/KbXC0YA=',
    returnUrl: 'https://nextjs-ecommerce-umber-beta.vercel.app/kuickpay-return',
    debugRedirectUrl: '',
    manualMode: false,
  },
};

const products = [
  { id: 1, name: 'Pro Fountain Pen', price: 2, priceAED: 2, pricePKR: 5, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=800' },
  { id: 2, name: 'Leather Journal', price: 10, priceAED: 10, pricePKR: 10, image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=800' },
  { id: 3, name: 'Minimalist Stapler', price: 52, priceAED: 52, pricePKR: 50, image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800' },
  { id: 4, name: 'Matte Black Mug', price: 100, priceAED: 100, pricePKR: 10, image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=800' },
];

const getProductPrice = (product, currency = 'AED') => {
  if (currency === 'PKR') {
    return product.pricePKR || product?.price;
  }
  return product.priceAED || product.price || 2;
};

const money = (n) => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 });

const Toast = ({ message, type }) => (
  <div className={`toast ${type === 'error' ? 'error' : ''}`}>
    {type === 'success'
      ? <CheckCircle2 size={16} className="toast-icon-success" />
      : <AlertCircle size={16} className="toast-icon-error" />}
    <span>{message}</span>
  </div>
);

const Field = ({ label, children }) => (
  <div className="field">
    <label className="field-label">{label}</label>
    {children}
  </div>
);

export default function Home() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [config, setConfig] = useState(PRESETS.local);
  const [env, setEnv] = useState('local');
  const [currency, setCurrency] = useState('AED'); // Default is AED

  // Embedded Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');

  // Embedded Inline State
  const [inlineSession, setInlineSession] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const storedCurrency = localStorage.getItem('kp_currency');
    if (storedCurrency === 'PKR' || storedCurrency === 'AED') {
      setCurrency(storedCurrency);
    }

    const storedCart = sessionStorage.getItem('kp_cart');
    if (storedCart) {
      try { setCart(JSON.parse(storedCart)); } catch (e) { }
    } else {
      setCart([{ ...products[0], qty: 1 }]);
    }

    const storedConfig = localStorage.getItem('kp_merchant_config');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        if (!parsed.checkoutMode) parsed.checkoutMode = 'modal';
        if (!parsed.checkoutUrl) parsed.checkoutUrl = parsed.baseUrl || 'http://localhost:3000';
        setConfig(parsed);
        const match = Object.keys(PRESETS).find(key => PRESETS[key].baseUrl === parsed.baseUrl && PRESETS[key].checkoutUrl === parsed.checkoutUrl);
        setEnv(match || 'custom');
      } catch (e) { }
    }
  }, []);

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('kp_currency', newCurrency);
    showToast(`Currency switched to ${newCurrency}`);
  };

  useEffect(() => {
    sessionStorage.setItem('kp_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('kp_merchant_config', JSON.stringify(config));
  }, [config]);

  const addToCart = (product) => {
    const exists = cart.find(i => i.id === product.id);
    setCart(exists
      ? cart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      : [...cart, { ...product, qty: 1 }]);
    showToast(`Added ${product.name}`);
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (id) => {
    const item = cart.find(i => i.id === id);
    setCart(cart.filter(i => i.id !== id));
    showToast(`Removed ${item?.name}`, 'error');
  };

  const getItemPrice = (item) => getProductPrice(item, currency);
  const total = cart.reduce((sum, i) => sum + getItemPrice(i) * i.qty, 0);

  const applyPreset = (key) => {
    setEnv(key);
    setConfig(PRESETS[key]);
    showToast(`Switched to ${PRESETS[key].name}`);
  };

  const handlePaymentSuccess = (data, orderId, amountValue) => {
    sessionStorage.setItem('kp_last_payment', JSON.stringify(data));
    const resolvedOrderId = data?.orderID || orderId;
    const resolvedTranId = data?.transactionID || 'TXN-' + Date.now();
    const resolvedStatus = data?.responseCode || '00';

    showToast('Payment Approved! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = `/kuickpay-return?orderID=${encodeURIComponent(resolvedOrderId)}&transactionID=${encodeURIComponent(resolvedTranId)}&status=${resolvedStatus}&amount=${encodeURIComponent(amountValue)}&currency=${encodeURIComponent(currency)}`;
    }, 600);
  };

  // Launch Modal Checkout
  const launchKuickPayModal = (sessionId, orderId, amountValue) => {
    const checkoutBaseUrl = config.checkoutUrl || 'https://checkout.kuickpay.com';

    if (typeof window !== 'undefined' && window.KuickPay && typeof window.KuickPay.open === 'function') {
      console.log('[KuickPay SDK] Launching checkout modal via SDK...');
      window.KuickPay.open({
        baseUrl: checkoutBaseUrl,
        sessionId: sessionId,
        mode: 'modal',
        closeOnBackdrop: true,
        closeOnEscape: true,
        onReady: () => console.log('[KuickPay SDK] Modal ready'),
        onSuccess: (data) => {
          console.log('[KuickPay SDK] Payment Approved:', data);
          handlePaymentSuccess(data, orderId, amountValue);
        },
        onFailed: (error) => {
          console.warn('[KuickPay SDK] Payment Declined:', error);
          showToast(error?.message || 'Payment was declined', 'error');
        },
        onClose: () => {
          console.log('[KuickPay SDK] Modal closed');
          showToast('Checkout dismissed');
        },
      });
    } else {
      console.log('[KuickPay React] Launching checkout modal via React component...');
      setActiveSessionId(sessionId);
      setCurrentOrderId(orderId);
      setCurrentAmount(amountValue);
      setIsModalOpen(true);
    }
  };

  // Launch Inline Checkout
  const launchKuickPayInline = (sessionId, orderId, amountValue) => {
    setInlineSession({ sessionId, orderId, amountValue });
    setTimeout(() => {
      document.getElementById('inline-checkout-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const orderId = `ORD-${Date.now()}`;
      const amountValue = total.toFixed(2);
      const { companyId, securedKey, baseUrl, returnUrl } = config;
      const timestamp = new Date().toISOString();

      const canonical = `${companyId}|${orderId}|${amountValue}|${amountValue}|${timestamp}`;
      const signature = CryptoJS.HmacSHA256(canonical, securedKey).toString(CryptoJS.enc.Base64);

      const payload = {
        companyid: companyId,
        orderid: orderId,
        amount: Number(amountValue).toFixed(2),
        amountPayable: Number(amountValue).toFixed(2),
        currency: currency,
        timestamp,
        signature,
        transactiondescription: `${config.merchantName} Checkout (${currency})`,
        returnurl: returnUrl,
      };

      const basicAuth = btoa(`${companyId}:${securedKey}`);
      let sessionId = null;
      let redirectUrl = null;
      let rawResponse = null;

      try {
        const res = await fetch(`${baseUrl}/checkout/api/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + basicAuth },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        rawResponse = data;
        sessionId = data?.responseData?.sessionID || data?.sessionID || data?.sessionId;
        redirectUrl = data?.responseData?.redirectURL || data?.redirectURL;
      } catch (apiErr) {
        console.warn('API call to /checkout/api/session failed:', apiErr);
      }

      // If gateway returned error or wasn't reachable in local test, generate simulated test session
      if (!sessionId) {
        sessionId = `KP-SESS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        redirectUrl = `${config.checkoutUrl || 'https://checkout.kuickpay.com'}/embed/${sessionId}`;
        showToast('Using local test session: ' + sessionId, 'success');
      }

      sessionStorage.setItem('kp_order', JSON.stringify({
        orderid: orderId,
        amount: Number(amountValue),
        amountpayable: Number(amountValue),
        currency,
        timestamp,
        signature,
      }));
      sessionStorage.setItem('kuickpaySession', sessionId);

      // Manual review mode
      if (config.debugRedirectUrl || config.manualMode) {
        setCheckoutResult({
          gatewayUrl: redirectUrl || `${config.checkoutUrl || 'https://checkout.kuickpay.com'}/embed/${sessionId}`,
          customUrl: config.debugRedirectUrl || '',
          raw: rawResponse || { sessionId, orderId, amount: amountValue },
          sessionId,
          orderId,
          amountValue,
        });
        showToast('Session created — review or launch');
        return;
      }

      // Choice of Mode
      if (config.checkoutMode === 'redirect') {
        window.location.href = redirectUrl || `${config.checkoutUrl || 'https://checkout.kuickpay.com'}/embed/${sessionId}`;
        return;
      } else if (config.checkoutMode === 'inline') {
        launchKuickPayInline(sessionId, orderId, amountValue);
      } else {
        // Default: modal
        launchKuickPayModal(sessionId, orderId, amountValue);
      }

    } catch (err) {
      showToast(err.message || 'Payment initiation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const step = cart.length === 0 ? 0 : loading ? 2 : checkoutResult ? 2 : inlineSession ? 2 : 1;
  const stepLabels = [
    'Basket',
    'Create session',
    config.checkoutMode === 'redirect' ? 'Redirect' : config.checkoutMode === 'inline' ? 'Inline Pay' : 'Modal Pay'
  ];

  return (
    <div style={{ marginBottom: '60px' }}>
      {toast && <Toast {...toast} />}

      {/* Embedded KuickPay Modal Component */}
      <KuickPayCheckoutModal
        isOpen={isModalOpen}
        sessionId={activeSessionId}
        baseUrl={config.checkoutUrl || 'https://checkout.kuickpay.com'}
        onClose={() => {
          setIsModalOpen(false);
          showToast('Checkout dismissed');
        }}
        onSuccess={(data) => {
          setIsModalOpen(false);
          handlePaymentSuccess(data, currentOrderId, currentAmount);
        }}
        onFailed={(err) => {
          showToast(err?.message || 'Payment declined', 'error');
        }}
      />

      {/* Manual Review Modal if manualMode is ON */}
      {checkoutResult && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Session Created</h2>
                <p>Choose your preferred embedded payment method</p>
              </div>
              <button className="icon-btn" onClick={() => { setCheckoutResult(null); setShowRawResponse(false); }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {showRawResponse ? (
                <div>
                  <div className="modal-label-row">
                    <span className="modal-label">Response payload</span>
                    <button className="link-btn" onClick={() => { navigator.clipboard.writeText(JSON.stringify(checkoutResult.raw, null, 2)); showToast('Copied'); }}>
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <pre className="raw-json">{JSON.stringify(checkoutResult.raw, null, 2)}</pre>
                  <button className="back-link" onClick={() => setShowRawResponse(false)}>← Back</button>
                </div>
              ) : (
                <>
                  <div className="modal-label-row">
                    <span className="modal-label">Session ID</span>
                    <button className="link-btn" onClick={() => { navigator.clipboard.writeText(checkoutResult.sessionId); showToast('Copied'); }}>
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <div className="url-box mono" style={{ fontSize: '0.85rem' }}>{checkoutResult.sessionId}</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const sid = checkoutResult.sessionId;
                        const oid = checkoutResult.orderId;
                        const amt = checkoutResult.amountValue;
                        setCheckoutResult(null);
                        launchKuickPayModal(sid, oid, amt);
                      }}
                    >
                      <Sparkles size={15} /> Modal (Popup)
                    </button>

                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        const sid = checkoutResult.sessionId;
                        const oid = checkoutResult.orderId;
                        const amt = checkoutResult.amountValue;
                        setCheckoutResult(null);
                        launchKuickPayInline(sid, oid, amt);
                      }}
                    >
                      <LayoutTemplate size={15} /> Inline (Embed)
                    </button>
                  </div>

                  <button
                    className="btn btn-outline"
                    style={{ width: '100%', marginTop: 8 }}
                    onClick={() => window.location.href = checkoutResult.gatewayUrl}
                  >
                    Open via Direct Redirect <ExternalLink size={14} />
                  </button>

                  <button className="back-link" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 14 }} onClick={() => setShowRawResponse(true)}>
                    View raw JSON response
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="header">
        <div className="container header-content">
          <div className="brand-row">
            <LogoMark />
            <div>
              <span className="brand-name">{config.merchantName || 'KP Merchant'}</span>
              <span className="brand-sub">embedded checkout demo</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Currency Selector (Default AED) */}
            <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#F1F5F9', border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
              <button
                type="button"
                onClick={() => changeCurrency('AED')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: currency === 'AED' ? 'var(--accent)' : 'transparent',
                  color: currency === 'AED' ? '#FFFFFF' : 'var(--ink-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                AED
              </button>
              <button
                type="button"
                onClick={() => changeCurrency('PKR')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: currency === 'PKR' ? 'var(--accent)' : 'transparent',
                  color: currency === 'PKR' ? '#FFFFFF' : 'var(--ink-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                PKR
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>
              <ShieldCheck size={13} />
              <span>
                {config.checkoutMode === 'modal' ? 'MODAL' : config.checkoutMode === 'inline' ? 'INLINE' : 'REDIRECT'}
              </span>
            </div>
            <span className="env-badge">{env.toUpperCase()}</span>
            <button className="icon-btn" onClick={() => setIsSettingsOpen(true)} title="Merchant Settings">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Hero Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, margin: '2rem 0 2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
              KuickPay Merchant Storefront
            </h1>
            <p className="hero-text" style={{ margin: 0 }}>
              Seamless in-app payments with KuickPay Embedded Checkout. Choose between <strong>Modal Popup</strong> and <strong>Inline Embed</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const testSession = `TEST-MODAL-${Date.now().toString(36).toUpperCase()}`;
                launchKuickPayModal(testSession, `ORD-${Date.now()}`, '100.00');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--accent)',
                backgroundColor: 'var(--accent-soft)',
                border: '1px solid rgba(18, 48, 196, 0.2)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={14} /> Test Modal
            </button>

            <button
              onClick={() => {
                const testSession = `TEST-INLINE-${Date.now().toString(36).toUpperCase()}`;
                launchKuickPayInline(testSession, `ORD-${Date.now()}`, '100.00');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#047857',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <LayoutTemplate size={14} /> Test Inline
            </button>

            <button
              onClick={() => window.location.href = '/sdk-checkout'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--ink)',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <Layers size={14} /> SDK Playground
            </button>
          </div>
        </div>

        {/* Product Catalog */}
        <div className="product-grid" id="products">
          {products.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-image-wrap">
                <img src={p.image} alt={p.name} className="product-image" />
              </div>
              <div className="product-row">
                <div>
                  <p className="product-name">{p.name}</p>
                  <p className="product-price mono">{currency} {money(getItemPrice(p))}</p>
                </div>
                <button className="add-btn" onClick={() => addToCart(p)} title="Add to basket">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Basket & Checkout */}
        <div className="receipt-wrap">
          <div className={`receipt-card ${cart.length > 0 ? 'has-items' : ''}`}>
            <div className="receipt-header">
              <ShoppingCart size={16} color="var(--ink-muted)" />
              <h2>Your basket</h2>
              {cart.length > 0 && <span className="receipt-count">{cart.length} item{cart.length > 1 ? 's' : ''}</span>}
            </div>

            <div className="receipt-body">
              {cart.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><ShoppingBag size={20} /></div>
                  <p className="empty-title">Your basket is empty</p>
                  <p className="empty-desc">Add a few items above to test the embedded checkout</p>
                  <button
                    className="empty-btn"
                    onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    Browse products <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                cart.map(i => (
                  <div key={i.id} className="receipt-row">
                    <div className="receipt-item-info">
                      <p className="receipt-item-name">{i.name}</p>
                      <p className="receipt-item-unit mono">{currency} {money(getItemPrice(i))} each</p>
                    </div>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => updateQty(i.id, -1)}><Minus size={12} /></button>
                      <span className="qty-value">{i.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(i.id, 1)}><Plus size={12} /></button>
                    </div>
                    <strong className="receipt-item-price mono">{currency} {money(getItemPrice(i) * i.qty)}</strong>
                    <button className="remove-btn" onClick={() => removeFromCart(i.id)}><Trash2 size={14} /></button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="receipt-total">
                <span className="receipt-total-label">Total</span>
                <span className="receipt-total-value mono">{currency} {money(total)}</span>
              </div>
            )}
          </div>
          {cart.length > 0 && <div className="torn-edge" />}

          {cart.length > 0 && (
            <div className="mt-2">
              <div className="steps">
                {stepLabels.map((label, idx) => (
                  <div key={label} className="step">
                    <div className={`step-label-group ${idx <= step ? 'active' : ''}`}>
                      <span className={`step-dot ${idx < step ? 'done' : idx === step ? 'current' : ''}`}>
                        {idx < step ? <Check size={10} /> : idx + 1}
                      </span>
                      <span className="step-text">{label}</span>
                    </div>
                    {idx < 2 && <div className={`step-line ${idx < step ? 'done' : ''}`} />}
                  </div>
                ))}
              </div>

              {/* Checkout Trigger Buttons */}
              {!inlineSession && (
                <button className="btn btn-primary" onClick={checkout} disabled={loading}>
                  {loading ? (
                    <><div className="spinner" /> Creating session…</>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>
                        Pay {currency} {money(total)} with KuickPay ({config.checkoutMode === 'inline' ? 'Inline' : config.checkoutMode === 'modal' ? 'Modal' : 'Redirect'})
                      </span>
                    </>
                  )}
                </button>
              )}

              {/* Mode indicator badge */}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                <ShieldCheck size={13} color="#16A34A" />
                <span>
                  {config.checkoutMode === 'inline'
                    ? 'Inline payment frame • 256-bit encrypted'
                    : config.checkoutMode === 'modal'
                      ? 'Modal popup • 256-bit encrypted'
                      : 'Full redirect to gateway'}
                </span>
              </div>
            </div>
          )}

          {/* Inline Checkout Embed Section */}
          {inlineSession && (
            <div id="inline-checkout-section" style={{ marginTop: 24, animation: 'fadeIn 0.25s ease' }}>
              <KuickPayCheckoutInline
                sessionId={inlineSession.sessionId}
                baseUrl={config.checkoutUrl || 'https://checkout.kuickpay.com'}
                onClose={() => {
                  setInlineSession(null);
                  showToast('Inline checkout cancelled');
                }}
                onSuccess={(data) => {
                  setInlineSession(null);
                  handlePaymentSuccess(data, inlineSession.orderId, inlineSession.amountValue);
                }}
                onFailed={(err) => {
                  showToast(err?.message || 'Payment declined', 'error');
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Merchant Config Drawer */}
      {isSettingsOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setIsSettingsOpen(false)} />
          <div className="drawer">
            <div className="drawer-header">
              <h2>Merchant Configuration</h2>
              <button className="icon-btn" onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
            </div>

            <div className="drawer-body">
              <Field label="Environment Preset">
                <div className="preset-row">
                  {Object.keys(PRESETS).map(key => (
                    <button key={key} onClick={() => applyPreset(key)} className={`preset-chip ${env === key ? 'active' : ''}`}>
                      {PRESETS[key].name}
                    </button>
                  ))}
                  <button onClick={() => setEnv('custom')} className={`preset-chip ${env === 'custom' ? 'active' : ''}`}>
                    Custom
                  </button>
                </div>
              </Field>

              <Field label="Checkout Experience">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => { setConfig({ ...config, checkoutMode: 'modal' }); setEnv('custom'); }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: config.checkoutMode === 'modal' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: config.checkoutMode === 'modal' ? 'var(--accent-soft)' : 'var(--card-bg)',
                      color: config.checkoutMode === 'modal' ? 'var(--accent)' : 'var(--ink)',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    ✨ Modal
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConfig({ ...config, checkoutMode: 'inline' }); setEnv('custom'); }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: config.checkoutMode === 'inline' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: config.checkoutMode === 'inline' ? 'var(--accent-soft)' : 'var(--card-bg)',
                      color: config.checkoutMode === 'inline' ? 'var(--accent)' : 'var(--ink)',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    📌 Inline
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConfig({ ...config, checkoutMode: 'redirect' }); setEnv('custom'); }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: config.checkoutMode === 'redirect' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: config.checkoutMode === 'redirect' ? 'var(--accent-soft)' : 'var(--card-bg)',
                      color: config.checkoutMode === 'redirect' ? 'var(--accent)' : 'var(--ink)',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    ↗ Redirect
                  </button>
                </div>
              </Field>

              <Field label="API Base URL (Gateway API for Session Creation & Status)">
                <input
                  className="field-input mono"
                  value={config.baseUrl || ''}
                  onChange={e => { setConfig({ ...config, baseUrl: e.target.value }); setEnv('custom'); }}
                  placeholder="https://prod-api.kuickpay.com"
                />
              </Field>

              <Field label="Checkout Base URL (Frontend App for Embed & SDK Script)">
                <input
                  className="field-input mono"
                  value={config.checkoutUrl || ''}
                  onChange={e => { setConfig({ ...config, checkoutUrl: e.target.value }); setEnv('custom'); }}
                  placeholder="https://checkout.kuickpay.com or http://localhost:3000"
                />
              </Field>

              <Field label="Merchant Store Name">
                <input className="field-input" value={config.merchantName} onChange={e => { setConfig({ ...config, merchantName: e.target.value }); setEnv('custom'); }} />
              </Field>

              <div className="field-row">
                <Field label="Company ID">
                  <input className="field-input" value={config.companyId} onChange={e => { setConfig({ ...config, companyId: e.target.value }); setEnv('custom'); }} />
                </Field>
                <Field label="Secured key">
                  <input className="field-input" type="password" value={config.securedKey} onChange={e => { setConfig({ ...config, securedKey: e.target.value }); setEnv('custom'); }} />
                </Field>
              </div>

              <Field label="Return URL">
                <input className="field-input" value={config.returnUrl} onChange={e => { setConfig({ ...config, returnUrl: e.target.value }); setEnv('custom'); }} />
              </Field>

              <div className="toggle-row">
                <div>
                  <p className="toggle-title">Manual Review Mode</p>
                  <p className="toggle-desc">Inspect payload and session before launching modal/inline</p>
                </div>
                <button className={`toggle ${config.manualMode ? 'on' : ''}`} onClick={() => { setConfig({ ...config, manualMode: !config.manualMode }); setEnv('custom'); }}>
                  <div className="toggle-thumb" />
                </button>
              </div>

              <div className="note-box">
                <Lock size={14} color="var(--ink-muted)" />
                <p>Both Modal and Inline checkout render inside an isolated, 256-bit encrypted iframe. No sensitive card data touches merchant servers.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}