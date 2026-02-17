'use client';
import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

/* ================= PRODUCTS ================= */

const products = [
  { id: 1, name: 'Ball Pen', price: 10, image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=800' },
  { id: 2, name: 'Notebook (A5)', price: 120, image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=800' },
  { id: 3, name: 'Stapler', price: 280, image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800' },
  { id: 4, name: 'Office Mug', price: 450, image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=800' },
 ];

/* ================= PAGE ================= */

export default function Home() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===== LOAD CART FROM SESSION ===== */
  useEffect(() => {
    const stored = sessionStorage.getItem('kp_cart');
    if (stored) setCart(JSON.parse(stored));
  }, []);

  /* ===== SAVE CART TO SESSION ===== */
  useEffect(() => {
    sessionStorage.setItem('kp_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const exists = cart.find(i => i.id === product.id);
    if (exists) {
      setCart(cart.map(i =>
        i.id === product.id ? { ...i, qty: i.qty + 1 } : i
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  /* ================= CHECKOUT ================= */

  const checkout = async () => {
    setLoading(true);
    try {
      const orderId = `ORD-${Date.now()}`;
      const amountValue = total.toFixed(2);
      const companyId = '100000041';
      const securedKey = 'O7eiNqeoudvnEhMF31p+9YpTzTYinmFyIG6mCO2Y8V4=';
      const timestamp = new Date().toISOString();

      const canonical = `${companyId}|${orderId}|${amountValue}|${amountValue}|${timestamp}`;
      const signature = CryptoJS.HmacSHA256(canonical, securedKey)
        .toString(CryptoJS.enc.Base64);

      const payload = {
        companyid: companyId,
        orderid: orderId,
        amount: Number(amountValue),
        amountPayable: Number(amountValue),
        timestamp,
        signature,
        transactiondescription: 'KP Demo Store Checkout',
        returnurl: 'http://localhost:3000/kuickpay-return'
      };

      const basicAuth = btoa(`${companyId}:${securedKey}`);

      const res = await fetch(
        'https://sandbox-api.kuickpay.com/checkout/api/session',
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
      console.log("🚀 ~ checkout ~ data:", data)

      if (!data?.responseData?.redirectURL) {
        alert('Unable to initialize KuickPay session');
        return;
      }

      /* ===== SAVE EVERYTHING IN SESSION STORAGE ===== */

      sessionStorage.setItem('kp_order', JSON.stringify({
        orderid: orderId,
        amount: Number(amountValue),
        timestamp
      }));

      sessionStorage.setItem(
        'kuickpaySession',
        JSON.stringify({
          sessionid: data.responseData.sessionID,
          companyid: data.responseData.companyID,
          orderid: orderId,
          amount: Number(amountValue),
          amountpayable: Number(amountValue),
          timestamp,
          signature
        })
      );

      window.location.href = data.responseData.redirectURL;

    } catch (err) {
      alert('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.logo}>KP Demo Store</h1>
        <p style={styles.tagline}>Secure payments powered by KuickPay</p>
      </header>

      <section style={styles.grid}>
        {products.map(p => (
          <div key={p.id} style={styles.card}>
            <img src={p.image} style={styles.image} />
            <h3>{p.name}</h3>
            <p style={styles.price}>PKR {p.price}</p>
            <button style={styles.btn} onClick={() => addToCart(p)}>
              Add to Cart
            </button>
          </div>
        ))}
      </section>

      <aside style={styles.cart}>
        <h2>Order Summary</h2>

        {cart.length === 0 && <p style={styles.empty}>Your cart is empty</p>}

        {cart.map(i => (
          <div key={i.id} style={styles.cartItem}>
            <span>{i.name} × {i.qty}</span>
            <strong>PKR {i.price * i.qty}</strong>
          </div>
        ))}

        {cart.length > 0 && (
          <>
            <div style={styles.total}>
              <span>Total</span>
              <strong>PKR {total}</strong>
            </div>

            <button
              style={{ ...styles.payBtn, opacity: loading ? 0.7 : 1 }}
              onClick={checkout}
              disabled={loading}
            >
              {loading ? 'Redirecting to KuickPay…' : 'Pay Securely'}
            </button>

            <p style={styles.secureNote}>🔒 100% secure • Powered by KuickPay</p>
          </>
        )}
      </aside>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: { minHeight: '100vh', background: '#f4f6fb', padding: 20 },
  header: { textAlign: 'center', marginBottom: 40 },
  logo: { fontSize: 32 },
  tagline: { color: '#555' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24, maxWidth: 1100, margin: '0 auto' },
  card: { background: '#fff', borderRadius: 16, padding: 16, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,.08)' },
  image: { width: '100%', height: 170, objectFit: 'cover', borderRadius: 12 },
  price: { fontWeight: 600, color: '#2563eb' },
  btn: { marginTop: 10, padding: '10px 16px', background: '#111', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' },
  cart: { maxWidth: 420, margin: '50px auto 0', background: '#fff', padding: 24, borderRadius: 20 },
  cartItem: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  empty: { color: '#777' },
  total: { display: 'flex', justifyContent: 'space-between', fontSize: 18, marginTop: 20 },
  payBtn: { marginTop: 20, width: '100%', padding: 14, background: '#16a34a', color: '#fff', borderRadius: 10, border: 'none' },
  secureNote: { marginTop: 12, fontSize: 13, textAlign: 'center', color: '#666' }
};
