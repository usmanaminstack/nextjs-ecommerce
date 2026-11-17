import './globals.css';
import Script from 'next/script';

export default function RootLayout({ children }) {
  const checkoutUrl = process.env.NEXT_PUBLIC_KUICKPAY_URL || 'http://localhost:3000';

  return (
    <html lang="en">
      <head>
        <title>KP Demo Store | Premium Checkout</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body>
        {children}
        <Script
          src={`${checkoutUrl}/kuickpay-checkout.js`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
