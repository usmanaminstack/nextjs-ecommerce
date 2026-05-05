import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>KP Demo Store | Premium Checkout</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body>
        {children}
      </body>
    </html>
  );
}

