'use client';
import { useState, useEffect, useCallback } from 'react';
import CryptoJS from 'crypto-js';
import {
  Settings, ShoppingCart, ShoppingBag, Trash2, Plus, Minus, X, Lock,
  CheckCircle2, AlertCircle, ArrowRight, Copy, Check
} from 'lucide-react';

const LogoMark = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" className="brand-mark">
    <polygon points="18,4 18,18 6,30 6,16" fill="#1230C4" />
    <polygon points="20,6 20,34 32,22 32,18" fill="#2F8FEF" />
    <polygon points="30,10 34,14 30,14" fill="#7CC0FF" />
  </svg>
);

const PRESETS = {
  local: { name: 'Local', merchantName: 'KP Local Sandbox', baseUrl: 'http://localhost:3000', companyId: '10010', securedKey: 'JNyb6+qG3UFJ2Gt6tnJxSyxgtuduP4gJEzx/KbXC0YA=', returnUrl: 'https://nextjs-ecommerce-umber-beta.vercel.app/kuickpay-return', debugRedirectUrl: '', manualMode: false },
  uat: { name: 'UAT', merchantName: 'KP UAT Hub', baseUrl: 'https://sandbox-api.kuickpay.com', companyId: '02429', securedKey: 'xWX+A8qbYkLgHf3e/pu6PZiycOGc0C/YXOr3XislvxI=', returnUrl: 'https://nextjs-ecommerce-umber-beta.vercel.app/kuickpay-return', debugRedirectUrl: '', manualMode: false },
  prod: { name: 'Prod', merchantName: 'KP Enterprise', baseUrl: 'https://prod-api.kuickpay.com', companyId: '10010', securedKey: 'JNyb6+qG3UFJ2Gt6tnJxSyxgtuduP4gJEzx/KbXC0YA=', returnUrl: 'https://nextjs-ecommerce-umber-beta.vercel.app/kuickpay-return', debugRedirectUrl: '', manualMode: false }
};

const products = [
  { id: 1, name: 'Pro Fountain Pen', price: 2, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=800' },
  { id: 2, name: 'Leather Journal', price: 10, image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=800' },
  { id: 3, name: 'Minimalist Stapler', price: 52, image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800' },
  { id: 4, name: 'Matte Black Mug', price: 100, image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=800' },
];

const money = (n) => Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0 });

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
  const [config, setConfig] = useState(PRESETS.uat);
  const [env, setEnv] = useState('uat');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const storedCart = sessionStorage.getItem('kp_cart');
    if (storedCart) setCart(JSON.parse(storedCart));
    const storedConfig = localStorage.getItem('kp_merchant_config');
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      setConfig(parsed);
      const match = Object.keys(PRESETS).find(key => PRESETS[key].baseUrl === parsed.baseUrl);
      setEnv(match || 'custom');
    }
  }, []);

  useEffect(() => { sessionStorage.setItem('kp_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('kp_merchant_config', JSON.stringify(config)); }, [config]);

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

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const applyPreset = (key) => {
    setEnv(key);
    setConfig(PRESETS[key]);
    showToast(`Switched to ${PRESETS[key].name}`);
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
        companyid: companyId, orderid: orderId,
        amount: Number(amountValue).toFixed(2), amountPayable: Number(amountValue).toFixed(2),
        timestamp, signature,
        transactiondescription: `${config.merchantName} Checkout`,
        returnurl: returnUrl
      };

      const basicAuth = btoa(`${companyId}:${securedKey}`);
      const res = await fetch(`${baseUrl}/checkout/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + basicAuth },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!data?.responseData?.redirectURL) throw new Error(data?.message || 'Gateway error');

      sessionStorage.setItem('kp_order', JSON.stringify({ orderid: orderId, amount: Number(amountValue), timestamp }));

      if (config.debugRedirectUrl || config.manualMode) {
        setCheckoutResult({ gatewayUrl: data.responseData.redirectURL, customUrl: config.debugRedirectUrl || '', raw: data });
        showToast('Session created — redirection paused');
      } else {
        window.location.href = data.responseData.redirectURL;
      }
    } catch (err) {
      showToast(err.message || 'Payment failed — is the API up?', 'error');
    } finally {
      setLoading(false);
    }
  };

  const step = cart.length === 0 ? 0 : loading ? 2 : checkoutResult ? 2 : 1;
  const stepLabels = ['Basket', 'Create session', 'Redirect'];

  return (
    <div style={{marginBottom:"50px"}}>
      {toast && <Toast {...toast} />}

      {checkoutResult && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Session created</h2>
                <p>Redirection paused for review</p>
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
                    <span className="modal-label">Gateway URL</span>
                    <button className="link-btn" onClick={() => { navigator.clipboard.writeText(checkoutResult.gatewayUrl); showToast('Copied'); }}>
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <div className="url-box">{checkoutResult.gatewayUrl}</div>
                  <button className="btn btn-primary" onClick={() => window.location.href = checkoutResult.gatewayUrl}>
                    Go to gateway <ArrowRight size={16} />
                  </button>

                  {checkoutResult.customUrl && (
                    <>
                      <div className="divider" />
                      <span className="modal-label" style={{ display: 'block', marginBottom: 8 }}>Custom debug URL</span>
                      <div className="url-box-plain">{checkoutResult.customUrl}</div>
                      <button className="btn btn-outline" onClick={() => window.location.href = checkoutResult.customUrl}>
                        Go to custom URL
                      </button>
                    </>
                  )}

                  <button className="back-link" style={{ display: 'block', width: '100%', textAlign: 'center' }} onClick={() => setShowRawResponse(true)}>
                    View raw JSON response
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="header">
        <div className="container header-content">
          <div className="brand-row">
            <LogoMark />
            <div>
              <span className="brand-name">{config.merchantName || 'KP Merchant'}</span>
              <span className="brand-sub">merchant testbed</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="env-badge">{env.toUpperCase()}</span>
            <button className="icon-btn" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <p className="hero-text">Add items, then run a real KuickPay checkout session against the configured environment.</p>

        <div className="product-grid" id="products">
          {products.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-image-wrap">
                <img src={p.image} alt={p.name} className="product-image" />
              </div>
              <div className="product-row">
                <div>
                  <p className="product-name">{p.name}</p>
                  <p className="product-price mono">AED {money(p.price)}</p>
                </div>
                <button className="add-btn" onClick={() => addToCart(p)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

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
                  <p className="empty-desc">Add a few items above to start a checkout session</p>
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
                      <p className="receipt-item-unit mono">AED {money(i.price)} each</p>
                    </div>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => updateQty(i.id, -1)}><Minus size={12} /></button>
                      <span className="qty-value">{i.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(i.id, 1)}><Plus size={12} /></button>
                    </div>
                    <strong className="receipt-item-price mono">{money(i.price * i.qty)}</strong>
                    <button className="remove-btn" onClick={() => removeFromCart(i.id)}><Trash2 size={14} /></button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="receipt-total">
                <span className="receipt-total-label">Total</span>
                <span className="receipt-total-value mono">AED {money(total)}</span>
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

              <button className="btn btn-primary" onClick={checkout} disabled={loading}>
                {loading ? (
                  <><div className="spinner" /> Creating session…</>
                ) : (
                  <><Lock size={14} /> Checkout securely</>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      {isSettingsOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setIsSettingsOpen(false)} />
          <div className="drawer">
            <div className="drawer-header">
              <h2>Merchant config</h2>
              <button className="icon-btn" onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
            </div>

            <div className="drawer-body">
              <Field label="Environment">
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

              <Field label="Merchant name">
                <input className="field-input" value={config.merchantName} onChange={e => { setConfig({ ...config, merchantName: e.target.value }); setEnv('custom'); }} />
              </Field>
              <Field label="API base URL">
                <input className="field-input" value={config.baseUrl} onChange={e => { setConfig({ ...config, baseUrl: e.target.value }); setEnv('custom'); }} />
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
                  <p className="toggle-title">Manual redirection</p>
                  <p className="toggle-desc">Review the gateway link before leaving this page</p>
                </div>
                <button className={`toggle ${config.manualMode ? 'on' : ''}`} onClick={() => { setConfig({ ...config, manualMode: !config.manualMode }); setEnv('custom'); }}>
                  <div className="toggle-thumb" />
                </button>
              </div>

              <Field label="Custom debug URL (optional)">
                <input className="field-input" placeholder="Alternate link shown at checkout" value={config.debugRedirectUrl || ''} onChange={e => { setConfig({ ...config, debugRedirectUrl: e.target.value }); setEnv('custom'); }} />
              </Field>

              <div className="note-box">
                <Lock size={14} color="var(--ink-muted)" />
                <p>Config is stored in this browser's local storage for testing convenience only — not a production credential store.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}