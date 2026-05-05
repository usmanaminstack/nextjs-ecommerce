'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ShoppingBag, ArrowLeft, Receipt, Calendar, Hash } from 'lucide-react';

export default function KuickPayReturn() {
  const [statusResponse, setStatusResponse] = useState(null);
  const [cart, setCart] = useState([]);
  const [order, setOrder] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const runStatusCheck = async () => {
      try {
        const sessionStr = sessionStorage.getItem('kuickpaySession');
        const cartStr = sessionStorage.getItem('kp_cart');
        const orderStr = sessionStorage.getItem('kp_order');
        const configStr = localStorage.getItem('kp_merchant_config');

        if (!sessionStr || !orderStr) throw new Error('Payment session expired');
        if (!configStr) throw new Error('Merchant configuration missing');

        const session = JSON.parse(sessionStr);
        const config = JSON.parse(configStr);
        
        setPaymentSession(session);
        setCart(cartStr ? JSON.parse(cartStr) : []);
        setOrder(JSON.parse(orderStr));

        const { companyId, securedKey, baseUrl } = config;
        const basicAuth = btoa(`${companyId}:${securedKey}`);

        const res = await fetch(
          `${baseUrl}/checkout/api/status`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Basic ' + basicAuth
            },
            body: JSON.stringify(session)
          }
        );

        const data = await res.json();
        setStatusResponse(data);

        if (data?.responseCode === '00') {
          // Clear sensitive session data on success after a delay
          setTimeout(() => {
            sessionStorage.removeItem('kuickpaySession');
            sessionStorage.removeItem('kp_cart');
          }, 5000);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    runStatusCheck();
  }, []);

  const isSuccess = statusResponse?.responseCode === '00';

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-xl p-8 sm:p-12 rounded-[40px] shadow-2xl relative overflow-hidden"
      >
        {/* Background glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 blur-[100px] opacity-20 -z-10 ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        {loading && (
          <div className="flex flex-col items-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
            <p className="text-slate-400 font-medium animate-pulse">Verifying Transaction...</p>
          </div>
        )}

        {!loading && (error || (statusResponse && !isSuccess)) && (
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-500/20"
            >
              <XCircle className="text-rose-500" size={40} />
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-4">Payment Failed</h2>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto">
              {error || statusResponse?.responseDescription || "Something went wrong with the transaction."}
            </p>
            <button 
              className="btn btn-primary w-full py-4 rounded-2xl flex gap-2"
              onClick={() => window.location.href = '/'}
            >
              <ArrowLeft size={20} />
              Return to Store
            </button>
          </div>
        )}

        {!loading && isSuccess && (
          <div>
            <div className="text-center mb-10">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20"
              >
                <CheckCircle2 className="text-emerald-500" size={40} />
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-2">Order Confirmed!</h2>
              <p className="text-slate-400 font-medium italic">Payment successful</p>
            </div>

            <div className="space-y-4 mb-10">
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                   <Hash size={18} className="text-indigo-400" />
                   <span className="text-sm text-slate-400 font-medium">Order ID</span>
                 </div>
                 <strong className="text-white font-mono">{order?.orderid}</strong>
               </div>
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                   <Calendar size={18} className="text-indigo-400" />
                   <span className="text-sm text-slate-400 font-medium">Date</span>
                 </div>
                 <strong className="text-white">{order ? new Date(order.timestamp).toLocaleDateString() : '-'}</strong>
               </div>
            </div>

            <div className="bg-slate-900/50 rounded-3xl p-6 border border-white/5 mb-10">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Receipt size={14} />
                Transaction Summary
              </h3>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">{item.name} <span className="text-slate-500 ml-1">×{item.qty}</span></span>
                    <strong className="text-white font-semibold">PKR {(item.price * item.qty).toLocaleString()}</strong>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Total Paid</p>
                    <p className="text-3xl font-black text-emerald-400 tracking-tight">
                      <span className="text-sm font-bold mr-1 opacity-50">PKR</span>
                      {Number(paymentSession?.amountpayable).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right pb-1">
                     <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Method</p>
                     <p className="text-xs text-slate-400 font-bold italic">KuickPay Secure</p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary w-full py-5 rounded-[20px] flex gap-2 group"
              onClick={() => window.location.href = '/'}
            >
              <ShoppingBag size={20} />
              Continue Shopping
              <ChevronRight size={18} className="ml-auto group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Re-using icon component for consistency
const ChevronRight = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
