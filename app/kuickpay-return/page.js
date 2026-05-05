'use client';

import { useEffect, useState } from 'react';

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

        if (!sessionStr || !orderStr) throw new Error('Payment session expired');

        const session = JSON.parse(sessionStr);
        setPaymentSession(session);
        setCart(cartStr ? JSON.parse(cartStr) : []);
        setOrder(JSON.parse(orderStr));

        const companyId = '10010';
        const securedKey = 'JNyb6+qG3UFJ2Gt6tnJxSyxgtuduP4gJEzx/KbXC0YA=';
        
      // const companyId = '02429';
      // const securedKey = 'VLqK98MkGK+KrZR7XL/vD/Vbwdvo1nulJj9bTCHA1tE=';
  //             const companyId = '100000041';
  // const securedKey = 'O7eiNqeoudvnEhMF31p+9YpTzTYinmFyIG6mCO2Y8V4=';
        const basicAuth = btoa(`${companyId}:${securedKey}`);

        const res = await fetch(
          'https://prod-api.kuickpay.com/checkout/api/status',
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
          setTimeout(() => sessionStorage.clear(), 3000);
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
    <div style={styles.page}>
      <div style={styles.card} className="fade-in">
        {loading && (
          <div style={styles.center}>
            <div style={styles.spinner}></div>
            <p style={styles.subtle}>Verifying payment status…</p>
          </div>
        )}

        {!loading && error && <Result type="failure" title="Payment Error" message={error} />}

        {!loading && statusResponse && !isSuccess && (
          <Result
            type="failure"
            title="Payment Failed"
            message={statusResponse.responseDescription}
          />
        )}

        {!loading && isSuccess && (
          <>
            <Result
              type="success"
              title="Payment Successful"
              message="Thank you! Your payment has been completed."
            />

            <div style={styles.receipt}>
              <ReceiptRow label="Order ID" value={order.orderid} />
              <ReceiptRow label="Date" value={new Date(order.timestamp).toLocaleString()} />

              <hr style={styles.hr} />

              {cart.map((item) => (
                <div key={item.id} style={styles.itemRow}>
                  <span>{item.name} × {item.qty}</span>
                  <strong>PKR {(item.price * item.qty).toLocaleString()}</strong>
                </div>
              ))}

              <hr style={styles.hr} />

              <TotalPaid amount={paymentSession?.amountpayable} />
            </div>

            <button style={styles.backBtn} onClick={() => (window.location.href = '/')}>
              Continue Shopping
            </button>
          </>
        )}
      </div>

      <style>{css}</style>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Result({ type, title, message }) {
  const success = type === 'success';
  return (
    <div style={styles.center}>
      <div
        style={{ ...styles.icon, ...(success ? styles.iconSuccess : styles.iconFailure) }}
        className="scale-in"
      >
        {success ? '✓' : '✕'}
      </div>
      <h2>{title}</h2>
      <p style={styles.message}>{message}</p>
    </div>
  );
}

function ReceiptRow({ label, value, bold }) {
  return (
    <div style={styles.receiptRow}>
      <span>{label}</span>
      <strong style={bold ? { fontSize: 16 } : {}}>{value}</strong>
    </div>
  );
}

function TotalPaid({ amount }) {
  return (
    <div style={styles.totalWrap} className="total-pop">
      <div>
        <p style={styles.totalLabel}>Total Paid</p>
        <p style={styles.totalSub}>Payment Completed</p>
      </div>
      <div style={styles.totalAmount}>
        <span style={styles.currency}>PKR</span>
        {Number(amount).toLocaleString()}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#f6f7fb,#e3e6ee)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: '#fff',
    borderRadius: 22,
    padding: 32,
    boxShadow: '0 40px 80px rgba(0,0,0,.15)'
  },
  center: { textAlign: 'center' },
  spinner: {
    width: 46,
    height: 46,
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 14px'
  },
  subtle: { color: '#666', fontSize: 14 },
  icon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    fontSize: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  iconSuccess: { background: '#e7f9ef', color: '#15803d' },
  iconFailure: { background: '#ffecec', color: '#b91c1c' },
  message: { color: '#555', marginBottom: 16 },

  receipt: {
    background: '#f8f9fc',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    fontSize: 14
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  hr: {
    border: 'none',
    borderTop: '1px dashed #ddd',
    margin: '12px 0'
  },

  totalWrap: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 16px',
    borderRadius: 14,
    background: 'linear-gradient(135deg,#111,#2b2b2b)',
    color: '#fff',
    marginTop: 14
  },
  totalLabel: { fontSize: 14, opacity: 0.85, marginBottom: 4 },
  totalSub: { fontSize: 12, opacity: 0.6 },
  totalAmount: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 0.4,
    display: 'flex',
    alignItems: 'baseline',
    gap: 6
  },
  currency: { fontSize: 12, opacity: 0.7 },

  backBtn: {
    marginTop: 22,
    width: '100%',
    padding: 14,
    background: '#111',
    color: '#fff',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer'
  }
};

/* ================= ANIMATIONS ================= */

const css = `
@keyframes spin { to { transform: rotate(360deg); } }
.fade-in { animation: fadeIn .6s ease-out; }
.scale-in { animation: scaleIn .5s cubic-bezier(.68,-0.55,.27,1.55); }
.total-pop { animation: popIn .6s ease-out; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { transform: scale(.6); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes popIn {
  0% { transform: scale(.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
`;
