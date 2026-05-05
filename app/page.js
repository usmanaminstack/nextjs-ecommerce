'use client';
import { useState, useEffect, useCallback } from 'react';
import CryptoJS from 'crypto-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
  ChevronRight,
  Lock,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  ExternalLink
} from 'lucide-react';

/* ================= CONFIG DEFAULTS ================= */

const PRESETS = {
  local: {
    name: 'Local',
    merchantName: 'KP Local Sandbox',
    baseUrl: 'http://localhost:3000',
    companyId: '10010',
    securedKey: 'JNyb6+qG3UFJ2Gt6tnJxSyxgtuduP4gJEzx/KbXC0YA=',
    returnUrl: 'http://localhost:3000/kuickpay-return',
    debugRedirectUrl: '',
    manualMode: false
  },
  uat: {
    name: 'UAT',
    merchantName: 'KP UAT Hub',
    baseUrl: 'https://sandbox-api.kuickpay.com',
    companyId: '10010',
    securedKey: 'JNyb6+qG3UFJ2Gt6tnJxSyxgtuduP4gJEzx/KbXC0YA=',
    returnUrl: 'http://localhost:3000/kuickpay-return',
    debugRedirectUrl: '',
    manualMode: false
  },
  prod: {
    name: 'Prod',
    merchantName: 'KP Enterprise',
    baseUrl: 'https://prod-api.kuickpay.com',
    companyId: '10010',
    securedKey: 'JNyb6+qG3UFJ2Gt6tnJxSyxgtuduP4gJEzx/KbXC0YA=',
    returnUrl: 'http://localhost:3000/kuickpay-return',
    debugRedirectUrl: '',
    manualMode: false
  }
};

/* ================= PRODUCTS ================= */

const products = [
  { id: 1, name: 'Pro Fountain Pen', price: 50, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=800' },
  { id: 2, name: 'Leather Journal', price: 100, image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=800' },
  { id: 3, name: 'Minimalist Stapler', price: 52, image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800' },
  { id: 4, name: 'Matte Black Mug', price: 100, image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=800' },
];

/* ================= COMPONENTS ================= */

const Toast = ({ message, type, onVisible }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border ${type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
      }`}
    style={{ minWidth: 300 }}
  >
    {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
    <span className="font-medium text-sm">{message}</span>
  </motion.div>
);

/* ================= PAGE ================= */

export default function Home() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [showRawResponse, setShowRawResponse] = useState(false);

  // Merchant Settings State
  const [config, setConfig] = useState(PRESETS.uat);
  const [env, setEnv] = useState('uat');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ===== LOAD SETTINGS & CART ===== */
  useEffect(() => {
    const storedCart = sessionStorage.getItem('kp_cart');
    if (storedCart) setCart(JSON.parse(storedCart));

    const storedConfig = localStorage.getItem('kp_merchant_config');
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      setConfig(parsed);
      const match = Object.keys(PRESETS).find(key => PRESETS[key].baseUrl === parsed.baseUrl);
      if (match) setEnv(match);
      else setEnv('custom');
    }
  }, []);

  /* ===== SAVE SETTINGS & CART ===== */
  useEffect(() => {
    sessionStorage.setItem('kp_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('kp_merchant_config', JSON.stringify(config));
  }, [config]);

  const addToCart = (product) => {
    const exists = cart.find(i => i.id === product.id);
    if (exists) {
      setCart(cart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    showToast(`Added ${product.name} to basket`);
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const removeFromCart = (id) => {
    const item = cart.find(i => i.id === id);
    setCart(cart.filter(i => i.id !== id));
    showToast(`Removed ${item?.name} from basket`, 'error');
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const applyPreset = (key) => {
    setEnv(key);
    setConfig(PRESETS[key]);
    showToast(`Applied ${PRESETS[key].name} preset`);
  };

  /* ================= CHECKOUT ================= */

  const checkout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const orderId = `ORD-${Date.now()}`;
      const amountValue = total.toFixed(2);
      const { companyId, securedKey, baseUrl, returnUrl } = config;
      const timestamp = new Date().toISOString();

      const canonical = `${companyId}|${orderId}|${amountValue}|${amountValue}|${timestamp}`;
      const signature = CryptoJS.HmacSHA256(canonical, securedKey)
        .toString(CryptoJS.enc.Base64);

      const payload = {
        companyid: companyId,
        orderid: orderId,
        amount: Number(amountValue).toFixed(2),
        amountPayable: Number(amountValue).toFixed(2),
        timestamp,
        signature,
        transactiondescription: `${config.merchantName} Checkout`,
        returnurl: returnUrl
      };

      const basicAuth = btoa(`${companyId}:${securedKey}`);

      const res = await fetch(
        `${baseUrl}/checkout/api/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + basicAuth
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      if (!data?.responseData?.redirectURL) {
        throw new Error(data?.message || 'Gateway error');
      }

      sessionStorage.setItem('kp_order', JSON.stringify({
        orderid: orderId,
        amount: Number(amountValue),
        timestamp
      }));

      if (config.debugRedirectUrl || config.manualMode) {
        setCheckoutResult({
          gatewayUrl: data.responseData.redirectURL,
          customUrl: config.debugRedirectUrl || '',
          raw: data
        });
        showToast('Session created! Redirection paused.');
      } else {
        window.location.href = data.responseData.redirectURL;
      }

    } catch (err) {
      console.error(err);
      showToast(err.message || 'Payment failed. Is the API up?', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <AnimatePresence>
        {toast && <Toast key="toast" {...toast} />}

        {checkoutResult && (
          <div className="drawer-overlay z-200" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass p-8 rounded-[32px] w-full max-w-lg shadow-[0_0_100px_rgba(99,102,241,0.2)]"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Manual Redirection</h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">Session created successfully</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowRawResponse(!showRawResponse)}
                    className={`p-2 rounded-xl transition-colors ${showRawResponse ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    title="View Raw Response"
                  >
                    <div className="font-mono text-[10px] font-bold">JSON</div>
                  </button>
                  <button onClick={() => { setCheckoutResult(null); setShowRawResponse(false); }} className="p-2 hover:bg-white/5 rounded-xl text-slate-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {showRawResponse ? (
                  <motion.div
                    key="raw"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Response Payload</label>
                      <button 
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(checkoutResult.raw, null, 2));
                          showToast('JSON copied to clipboard!');
                        }}
                      >
                        <Copy size={12} /> COPY JSON
                      </button>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <pre className="text-[10px] text-indigo-300 font-mono leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(checkoutResult.raw, null, 2)}
                      </pre>
                    </div>
                    <button 
                      className="btn glass w-full py-4 text-sm gap-2 text-white border-white/5"
                      onClick={() => setShowRawResponse(false)}
                    >
                      Back to Redirection
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="links"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">API Response URL</label>
                        <button 
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(checkoutResult.gatewayUrl);
                            showToast('URL copied to clipboard!');
                          }}
                        >
                          <Copy size={12} /> COPY
                        </button>
                      </div>
                      <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 mb-2 group relative">
                        <p className="text-xs text-emerald-400 font-mono break-all line-clamp-2 pr-8">{checkoutResult.gatewayUrl}</p>
                        <a href={checkoutResult.gatewayUrl} target="_blank" className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/50 hover:text-emerald-500 transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <button 
                        className="btn btn-primary w-full py-4 text-sm gap-2"
                        onClick={() => window.location.href = checkoutResult.gatewayUrl}
                      >
                        Go to Gateway <ArrowRight size={16} />
                      </button>
                    </div>

                    {(checkoutResult.customUrl) && (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="h-[1px] flex-grow bg-white/5" />
                          <span className="text-[10px] font-bold text-slate-600 uppercase">OR</span>
                          <div className="h-[1px] flex-grow bg-white/5" />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Your Custom URL</label>
                            <button 
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                              onClick={() => {
                                navigator.clipboard.writeText(checkoutResult.customUrl);
                                showToast('URL copied to clipboard!');
                              }}
                            >
                              <Copy size={12} /> COPY
                            </button>
                          </div>
                          <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 mb-2">
                            <p className="text-xs text-indigo-400 font-mono break-all line-clamp-2">{checkoutResult.customUrl}</p>
                          </div>
                          <button 
                            className="btn glass w-full py-4 text-sm gap-2 text-white border-indigo-500/20"
                            onClick={() => window.location.href = checkoutResult.customUrl}
                          >
                            Go to Custom URL <ArrowRight size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= HEADER ================= */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="header"
      >
        <div className="container header-content">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <Zap className="text-indigo-400" size={24} />
            </div>
            <div>
              <h1 className="logo">{config.merchantName || 'KP Merchant'}</h1>
              <p className="text-xs text-slate-500 font-medium">Powered by KuickPay</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="badge hidden sm:flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {env.toUpperCase()}
            </div>
            <button
              className="btn-icon"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* ================= HERO ================= */}
      <section className="container pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Premium <span className="text-indigo-400">Merchant</span> Testbed
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Test your gateway integrations in a high-fidelity environment. Configure endpoints, merchant keys, and redirection URLs in real-time.
          </p>
        </motion.div>
      </section>

      {/* ================= MAIN CONTENT ================= */}
      <main className="container">
        <div className="product-grid">
          {products.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="product-card"
            >
              <div className="product-image-container">
                <img src={p.image} className="product-image" alt={p.name} />
                <div className="absolute top-4 right-4">
                  <div className="glass px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest">
                    In Stock
                  </div>
                </div>
              </div>
              <div className="product-info">
                <h3>{p.name}</h3>
                <div className="flex justify-between items-center mt-4">
                  <p className="product-price">PKR {p.price.toLocaleString()}</p>
                  <button className="btn btn-primary" onClick={() => addToCart(p)}>
                    <Plus size={18} />
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ================= CART SECTION ================= */}
        <section className="max-w-3xl mx-auto py-12">
          <motion.div
            layout
            className="glass p-8 rounded-[32px]"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-slate-800 rounded-xl">
                <ShoppingCart className="text-slate-400" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">Your Basket</h2>
            </div>

            <AnimatePresence mode="popLayout">
              {cart.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 text-center"
                >
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                    <ShoppingCart className="text-slate-500" size={24} />
                  </div>
                  <p className="text-slate-500 font-medium">Your basket is currently empty</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {cart.map(i => (
                    <motion.div
                      layout
                      key={i.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="cart-item group"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700">
                        <img src={i.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-white">{i.name}</p>
                        <p className="text-sm text-slate-500">PKR {i.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                          <button onClick={() => updateQty(i.id, -1)} className="p-1 text-slate-400 hover:text-white"><Minus size={14} /></button>
                          <span className="w-8 text-center text-sm font-bold text-white">{i.qty}</span>
                          <button onClick={() => updateQty(i.id, 1)} className="p-1 text-slate-400 hover:text-white"><Plus size={14} /></button>
                        </div>
                        <strong className="w-24 text-right text-indigo-400">PKR {(i.price * i.qty).toLocaleString()}</strong>
                        <button
                          onClick={() => removeFromCart(i.id)}
                          className="p-2 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {cart.length > 0 && (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 pt-8 border-t border-slate-800"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Estimated Total</p>
                    <p className="text-3xl font-black text-white">PKR {total.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-1 justify-end">
                      <Lock size={12} /> Secure Connection
                    </p>
                    <p className="text-xs text-slate-600">Tax and fees included</p>
                  </div>
                </div>

                <button
                  className="btn btn-primary w-full py-5 text-lg group"
                  onClick={checkout}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting to Gateway...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Secure Checkout
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        </section>
      </main>

      {/* ================= SETTINGS DRAWER ================= */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="drawer-overlay"
              onClick={() => setIsSettingsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="drawer custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Merchant Config</h2>
                  <p className="text-xs text-slate-500 font-medium">Session & Redirection Parameters</p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="pr-2 custom-scrollbar">
                <div className="form-group">
                  <label>Environment Profile</label>
                  <div className="preset-grid">
                    {Object.keys(PRESETS).map(key => (
                      <button
                        key={key}
                        className={`preset-btn ${env === key ? 'active' : ''}`}
                        onClick={() => applyPreset(key)}
                      >
                        {PRESETS[key].name}
                      </button>
                    ))}
                    <button
                      className={`preset-btn ${env === 'custom' ? 'active' : ''}`}
                      onClick={() => setEnv('custom')}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="form-group">
                    <label>Merchant Brand Name</label>
                    <input
                      className="form-control"
                      value={config.merchantName}
                      onChange={e => {
                        setConfig({ ...config, merchantName: e.target.value });
                        setEnv('custom');
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>API Gateway Endpoint</label>
                    <input
                      className="form-control font-mono text-sm"
                      value={config.baseUrl}
                      onChange={e => {
                        setConfig({ ...config, baseUrl: e.target.value });
                        setEnv('custom');
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label>Company ID</label>
                      <input
                        className="form-control font-mono text-sm"
                        value={config.companyId}
                        onChange={e => {
                          setConfig({ ...config, companyId: e.target.value });
                          setEnv('custom');
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Security Key</label>
                      <input
                        className="form-control font-mono text-sm"
                        type="password"
                        value={config.securedKey}
                        onChange={e => {
                          setConfig({ ...config, securedKey: e.target.value });
                          setEnv('custom');
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Post-Payment Return URI</label>
                    <input
                      className="form-control font-mono text-sm"
                      value={config.returnUrl}
                      onChange={e => {
                        setConfig({ ...config, returnUrl: e.target.value });
                        setEnv('custom');
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="flex justify-between items-center cursor-pointer group">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manual Redirection Mode</span>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={config.manualMode || false}
                        onChange={e => {
                          setConfig({ ...config, manualMode: e.target.checked });
                          setEnv('custom');
                        }}
                      />
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${config.manualMode ? 'bg-indigo-500' : 'bg-slate-800 border border-white/10'}`}>
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${config.manualMode ? 'left-6' : 'left-1'}`} />
                      </div>
                    </label>
                    <p className="text-[10px] text-slate-600 mt-2 italic">
                      Always show the redirection links before moving to the gateway.
                    </p>
                  </div>

                  <div className="form-group">
                    <label>Manual Debug URL (Optional)</label>
                    <input
                      className="form-control font-mono text-sm"
                      placeholder="Show manual links instead of auto-redirect"
                      value={config.debugRedirectUrl || ''}
                      onChange={e => {
                        setConfig({ ...config, debugRedirectUrl: e.target.value });
                        setEnv('custom');
                      }}
                    />
                    <p className="text-[10px] text-slate-500 mt-2 italic">
                      If filled, checkout will show a choice between API URL and this URL.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                <div className="flex gap-3">
                  <Lock className="text-indigo-400 shrink-0" size={18} />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Configurations are persisted in <span className="text-indigo-300 font-bold">LocalStorage</span>. Sensitive keys are handled locally for signature generation.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="container py-12 text-center">
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="w-10 h-[1px] bg-slate-800" />
          <Zap className="text-slate-700" size={16} />
          <div className="w-10 h-[1px] bg-slate-800" />
        </div>
        <p className="text-slate-600 text-sm font-medium">
          © {new Date().getFullYear()} KuickPay Advanced Testbed · All Rights Reserved
        </p>
      </footer>
    </div>
  );
}

