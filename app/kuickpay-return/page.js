'use client';
import { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';
import { CheckCircle2, XCircle, ArrowLeft, ShoppingBag } from 'lucide-react';

const money = (n) => Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0 });

export default function KuickPayReturn() {
  const [statusResponse, setStatusResponse] = useState(null);
  const [cart, setCart] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const runStatusCheck = async () => {
      try {
        const sessionID = sessionStorage.getItem('kuickpaySession');
        const cartStr = sessionStorage.getItem('kp_cart');
        const orderStr = sessionStorage.getItem('kp_order');
        const configStr = localStorage.getItem('kp_merchant_config');

        if (!sessionID || !orderStr) throw new Error('Payment session expired');
        if (!configStr) throw new Error('Merchant configuration missing');

        const config = JSON.parse(configStr);
        const parsedOrder = JSON.parse(orderStr);

        setCart(cartStr ? JSON.parse(cartStr) : []);
        setOrder(parsedOrder);

        const { companyId, securedKey, baseUrl } = config;
        const { orderid, amount, amountpayable } = parsedOrder;

        // Sign a fresh status request the same way checkout signs a session request
        const timestamp = new Date().toISOString();
        const canonical = `${companyId}|${orderid}|${amount}|${amountpayable}|${timestamp}`;
        const signature = CryptoJS.HmacSHA256(canonical, securedKey).toString(CryptoJS.enc.Base64);

        const statusPayload = {
          sessionid: sessionID,
          companyid: companyId,
          orderid,
          amount,
          amountpayable,
          timestamp,
          signature
        };

        const basicAuth = btoa(`${companyId}:${securedKey}`);
        const res = await fetch(`${baseUrl}/checkout/api/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + basicAuth },
          body: JSON.stringify(statusPayload)
        });

        const data = await res.json();
        setStatusResponse(data);

        if (data?.responseCode === '00') {
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
    <div className="return-page">
      {loading && (
        <div className="status-loading">
          <div className="spinner-dark" />
          <p>Verifying transaction…</p>
        </div>
      )}

      {!loading && (error || (statusResponse && !isSuccess)) && (
        <div className="status-card">
          <div className="status-icon fail">
            <XCircle color="var(--danger)" size={22} />
          </div>
          <h2>Payment failed</h2>
          <p className="desc">{error || statusResponse?.responseDescription || 'Something went wrong with the transaction.'}</p>
          <button className="btn btn-outline" onClick={() => window.location.href = '/'}>
            <ArrowLeft size={16} /> Return to store
          </button>
        </div>
      )}

      {!loading && isSuccess && (
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div className="status-card success-card">
            <div className="stamp">PAID</div>

            <div className="status-icon success">
              <CheckCircle2 color="var(--accent)" size={22} />
            </div>
            <h2>Order confirmed</h2>
            <p className="desc" style={{ marginBottom: 24 }}>Payment received successfully</p>

            <div className="success-row">
              <span style={{ color: 'var(--ink-muted)' }}>Order ID</span>
              <span className="mono" style={{ fontWeight: 500 }}>{order?.orderid}</span>
            </div>
            <div className="success-row last">
              <span style={{ color: 'var(--ink-muted)' }}>Date</span>
              <span className="mono" style={{ fontWeight: 500 }}>{order ? new Date(order.timestamp).toLocaleDateString() : '—'}</span>
            </div>

            <p className="section-label">Items</p>
            {cart.map((item) => (
              <div key={item.id} className="item-row">
                <span>{item.name} <span style={{ color: 'var(--ink-muted)' }}>×{item.qty}</span></span>
                <span className="mono">{money(item.price * item.qty)}</span>
              </div>
            ))}

            <div className="total-row">
              <span className="receipt-total-label">Total paid</span>
              <span className="total-value mono">AED {money(order?.amountpayable || 0)}</span>
            </div>
          </div>
          <div className="torn-edge" />

          <div style={{ marginTop: 24 }}>
            <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
              <ShoppingBag size={16} /> Continue shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}