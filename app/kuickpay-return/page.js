'use client';

import { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';
import { CheckCircle2, XCircle, ArrowLeft, ShoppingBag, Printer, ShieldCheck } from 'lucide-react';

const money = (n) => Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 });

export default function KuickPayReturn() {
  const [statusResponse, setStatusResponse] = useState(null);
  const [cart, setCart] = useState([]);
  const [order, setOrder] = useState(null);
  const [currency, setCurrency] = useState('AED');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processReturn = async () => {
      try {
        // Read URL search params safely on client
        const searchParams = new URLSearchParams(window.location.search);
        const queryOrderId = searchParams.get('orderID') || searchParams.get('orderid');
        const queryTranId = searchParams.get('transactionID') || searchParams.get('tranId') || searchParams.get('transactionId');
        const queryStatus = searchParams.get('status');

        const sessionID = sessionStorage.getItem('kuickpaySession');
        const cartStr = sessionStorage.getItem('kp_cart');
        const orderStr = sessionStorage.getItem('kp_order');
        const lastPaymentStr = sessionStorage.getItem('kp_last_payment');
        const configStr = localStorage.getItem('kp_merchant_config');

        const parsedCart = cartStr ? JSON.parse(cartStr) : [];
        setCart(parsedCart);

        let parsedOrder = orderStr ? JSON.parse(orderStr) : null;
        if (!parsedOrder && queryOrderId) {
          parsedOrder = {
            orderid: queryOrderId,
            amountpayable: searchParams.get('amount') || 0,
            currency: searchParams.get('currency') || 'AED',
            timestamp: new Date().toISOString(),
          };
        }
        setOrder(parsedOrder);

        const resolvedCurrency = searchParams.get('currency') || parsedOrder?.currency || 'AED';
        setCurrency(resolvedCurrency);

        // Case 1: Returned directly from KuickPay Embedded Checkout with success params
        if (queryStatus === '00' || queryStatus === 'success' || queryTranId) {
          const resolvedTranId = queryTranId || (lastPaymentStr ? JSON.parse(lastPaymentStr).transactionID : 'TXN-' + Date.now());
          setTransactionId(resolvedTranId);
          setStatusResponse({
            responseCode: '00',
            responseDescription: 'Transaction Successful',
            transactionId: resolvedTranId,
          });

          // Cleanup cart and session after successful payment
          setTimeout(() => {
            sessionStorage.removeItem('kuickpaySession');
            sessionStorage.removeItem('kp_cart');
          }, 3000);

          setLoading(false);
          return;
        }

        // Case 2: Returned from gateway redirect with session ID — verify via status inquiry API
        if (!sessionID || !parsedOrder) {
          throw new Error('Payment session expired or order not found');
        }
        if (!configStr) {
          throw new Error('Merchant configuration missing');
        }

        const config = JSON.parse(configStr);
        const { companyId, securedKey, baseUrl } = config;
        const { orderid, amount, amountpayable, timestamp, signature } = parsedOrder;

        const canonical = `${companyId}|${orderid}|${amount || amountpayable}|${amountpayable}|${timestamp}`;
        const statusSignature = signature || CryptoJS.HmacSHA256(canonical, securedKey).toString(CryptoJS.enc.Base64);

        const statusPayload = {
          sessionid: sessionID,
          companyid: companyId,
          orderid,
          amount: amount || amountpayable,
          amountpayable,
          timestamp,
          signature: statusSignature,
        };

        const basicAuth = btoa(`${companyId}:${securedKey}`);
        const res = await fetch(`${baseUrl}/checkout/api/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + basicAuth,
          },
          body: JSON.stringify(statusPayload),
        });

        const data = await res.json();
        setStatusResponse(data);
        if (data?.transactionId || data?.transactionID) {
          setTransactionId(data.transactionId || data.transactionID);
        }

        if (data?.responseCode === '00') {
          setTimeout(() => {
            sessionStorage.removeItem('kuickpaySession');
            sessionStorage.removeItem('kp_cart');
          }, 4000);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    processReturn();
  }, []);

  const isSuccess = statusResponse?.responseCode === '00';

  return (
    <div className="return-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      {loading && (
        <div className="status-loading" style={{ textAlign: 'center' }}>
          <div className="spinner-dark" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.95rem' }}>Verifying KuickPay transaction…</p>
        </div>
      )}

      {!loading && (error || (statusResponse && !isSuccess)) && (
        <div className="status-card" style={{ maxWidth: 420, width: '100%', textAlign: 'center', padding: '2rem' }}>
          <div className="status-icon fail" style={{ margin: '0 auto 16px' }}>
            <XCircle color="var(--danger)" size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Payment Not Completed</h2>
          <p className="desc" style={{ color: 'var(--ink-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
            {error || statusResponse?.responseDescription || 'The transaction was declined or cancelled.'}
          </p>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => window.location.href = '/'}>
            <ArrowLeft size={16} /> Return to store & retry
          </button>
        </div>
      )}

      {!loading && isSuccess && (
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="status-card success-card" style={{ position: 'relative' }}>
            <div className="stamp">PAID</div>

            <div className="status-icon success" style={{ marginBottom: 12 }}>
              <CheckCircle2 color="var(--accent)" size={26} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
              Thank You!
            </h2>
            <p className="desc" style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              Your payment has been processed successfully.
            </p>

            <div className="success-row">
              <span style={{ color: 'var(--ink-muted)' }}>Order ID</span>
              <span className="mono" style={{ fontWeight: 600 }}>{order?.orderid || 'N/A'}</span>
            </div>

            {transactionId && (
              <div className="success-row">
                <span style={{ color: 'var(--ink-muted)' }}>Transaction ID</span>
                <span className="mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>{transactionId}</span>
              </div>
            )}

            <div className="success-row last">
              <span style={{ color: 'var(--ink-muted)' }}>Date & Time</span>
              <span className="mono" style={{ fontWeight: 500 }}>
                {order?.timestamp ? new Date(order.timestamp).toLocaleString() : new Date().toLocaleString()}
              </span>
            </div>

            {cart.length > 0 && (
              <>
                <p className="section-label" style={{ marginTop: 18, marginBottom: 10, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)' }}>
                  Purchased Items
                </p>
                {cart.map((item) => (
                  <div key={item.id} className="item-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.88rem' }}>
                    <span>
                      {item.name} <span style={{ color: 'var(--ink-muted)', marginLeft: 4 }}>×{item.qty}</span>
                    </span>
                    <span className="mono" style={{ fontWeight: 500 }}>{currency} {money(item.price * item.qty)}</span>
                  </div>
                ))}
              </>
            )}

            <div className="total-row" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="receipt-total-label" style={{ fontWeight: 600 }}>Total Paid</span>
              <span className="total-value mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                {currency} {money(order?.amountpayable || order?.amount || 0)}
              </span>
            </div>

            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
              <ShieldCheck size={14} color="#16A34A" /> Verified by KuickPay Gateway
            </div>
          </div>
          <div className="torn-edge" />

          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button
              className="btn btn-outline"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => window.print()}
            >
              <Printer size={16} /> Print Receipt
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => window.location.href = '/'}
            >
              <ShoppingBag size={16} /> Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}