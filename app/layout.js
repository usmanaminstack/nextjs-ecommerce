export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>KP Demo Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body style={styles.body}>
        {/* ================= HEADER ================= */}
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <div>
              <h1 style={styles.logo}>KP Demo Store</h1>
              <p style={styles.subtitle}>
                Secure payments powered by KuickPay
              </p>
            </div>

            <div style={styles.badge}>
              🔒 Sandbox Mode
            </div>
          </div>
        </header>

        {/* ================= CONTENT ================= */}
        <main style={styles.main}>
          {children}
        </main>

        {/* ================= FOOTER ================= */}
        <footer style={styles.footer}>
          <p>
            © {new Date().getFullYear()} KP Demo Store · Payments by KuickPay
          </p>
          <p style={styles.footerNote}>
            This is a demo environment for testing purposes only
          </p>
        </footer>
      </body>
    </html>
  );
}

/* ================= STYLES ================= */

const styles = {
  body: {
    margin: 0,
    padding: 0,
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    background: 'linear-gradient(135deg, #f6f7fb, #e9ecf3)',
    color: '#111'
  },

  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(17,17,17,0.85)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
  },

  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '14px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  logo: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#fff'
  },

  subtitle: {
    margin: 0,
    fontSize: 13,
    color: '#c7c7c7'
  },

  badge: {
    fontSize: 12,
    padding: '6px 12px',
    background: '#16a34a',
    color: '#fff',
    borderRadius: 20,
    fontWeight: 600
  },

  main: {
    minHeight: 'calc(100vh - 160px)',
    paddingBottom: 40
  },

  footer: {
    marginTop: 60,
    padding: '24px 16px',
    textAlign: 'center',
    background: '#111',
    color: '#aaa'
  },

  footerNote: {
    marginTop: 6,
    fontSize: 12,
    color: '#777'
  }
};
