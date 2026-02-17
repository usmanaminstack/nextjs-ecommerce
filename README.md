
# Simple Next.js E-Commerce

Steps to run:

1. Install dependencies:
   npm install

2. Run project:
   npm run dev

Flow:
- User selects products
- Add to cart
- Click Checkout
- Calls /api/getSession
- Calls /api/payment
- Redirects to payment URL (can be opened in WebView in mobile apps)
