# KuickPay Merchant Integration Guide

This guide outlines the technical steps required to integrate the KuickPay Checkout Gateway into your e-commerce platform.

## 1. Prerequisites

Before starting, ensure you have the following credentials provided by KuickPay:
- **Company ID**: Your unique merchant identifier.
- **Secured Key**: A secret key used for request signing and authentication.
- **API Base URL**: The backend gateway endpoint for session creation & transaction inquiry.
- **Checkout Base URL**: The frontend web application endpoint where the checkout iframe (`/embed/[sessionId]`) and SDK script (`kuickpay-checkout.js`) reside.

### Base URLs Matrix
| Environment | API Base URL (`baseUrl`) | Checkout Base URL (`checkoutUrl`) |
| :--- | :--- | :--- |
| **Local Dev** | `https://prod-api.kuickpay.com` (or API server) | `http://localhost:3000` (local `kuickpay-payments`) |
| **UAT Sandbox** | `https://sandbox-api.kuickpay.com` | `https://testcheckout.kuickpay.com` |
| **Production** | `https://prod-api.kuickpay.com` | `https://checkout.kuickpay.com` |

---

## 2. Initiation Flow

The integration follows a simple 3-step flow:
1. **Create Session**: Your server sends an order request to KuickPay.
2. **Redirect User**: You redirect the user to the `redirectURL` provided in the response.
3. **Handle Return**: KuickPay redirects the user back to your site with the payment result.

---

## 3. Step 1: Create Payment Session

**Endpoint:** `POST /checkout/api/session`

### Authentication
Use **Basic Auth** with your `CompanyID` as the username and `SecuredKey` as the password.

```http
Authorization: Basic base64(CompanyID:SecuredKey)
Content-Type: application/json
```

### Request Payload
| Field | Type | Description |
| :--- | :--- | :--- |
| `companyid` | string | Your Company ID |
| `orderid` | string | Unique order identifier from your system |
| `amount` | string | Order amount (e.g., "1250.00") |
| `amountPayable` | string | Total amount user should pay |
| `currency` | string | Currency code: `"AED"` (default) or `"PKR"` |
| `timestamp` | string | ISO 8601 formatted timestamp |
| `transactiondescription` | string | Brief description of the order |
| `returnurl` | string | Where to send the user after payment |
| `signature` | string | HMAC SHA256 hash of the request data |

### Signature Generation
To ensure request integrity, you must generate a signature using **HMAC SHA256**.

1. **Construct Canonical String:**
   `companyid|orderid|amount|amountPayable|timestamp`
   
2. **Hash with Secured Key:**
   Use your `SecuredKey` as the HMAC key.

**Javascript Example:**
```javascript
const canonical = `${companyId}|${orderId}|${amount}|${amountPayable}|${timestamp}`;
const signature = CryptoJS.HmacSHA256(canonical, securedKey).toString(CryptoJS.enc.Base64);
```

---

## 4. Step 2: Handle Response & Redirect

A successful request returns a `200 OK` with a JSON body:

```json
{
  "success": true,
  "responseData": {
    "sessionID": "ABC-123-XYZ",
    "redirectURL": "https://gateway.kuickpay.com/pay?session=ABC-123-XYZ",
    "companyID": "10010"
  }
}
```

**Action:** Redirect your user to the `redirectURL` immediately.

---

## 5. Step 3: Payment Return

After the payment process, KuickPay will redirect the user back to your `returnurl`.

**Query Parameters:**
- `status`: `success`, `failed`, or `cancelled`.
- `orderid`: The ID you provided.
- `sessionid`: The KuickPay session ID.

**Note:** You should always verify the payment status on your server by calling the Transaction Inquiry API before fulfilling the order.

---

## 6. Step 4: Verify Payment Status (Transaction Inquiry)

To securely verify the final transaction status, your server should call the Transaction Inquiry API. **Always perform this check on your backend server** to prevent exposing your `SecuredKey`.

**Endpoint:** `POST /checkout/api/status`

### Authentication
Use **Basic Auth** with your `CompanyID` as the username and `SecuredKey` as the password.

```http
Authorization: Basic base64(CompanyID:SecuredKey)
Content-Type: application/json
```

### Request Payload
Send the session object received during Step 2:
```json
{
  "sessionID": "ABC-123-XYZ",
  "redirectURL": "https://gateway.kuickpay.com/pay?session=ABC-123-XYZ",
  "companyID": "10010"
}
```

### Response
Returns the status details of the transaction. A `responseCode` of `"00"` indicates success.
```json
{
  "responseCode": "00",
  "responseDescription": "Transaction Successful",
  "transactionId": "TXN-78910"
}
```

## 5. Embedded Checkout (Modal & Inline)

Instead of sending users away with `window.location.href = redirectURL`, you can embed KuickPay directly on your site using either **Modal (Popup)** or **Inline (On-Page)** mode.

### Option A: Using the Universal SDK (`kuickpay-checkout.js`)
Include the SDK in your layout (`app/layout.js` or HTML `<head>`):
```html
<script src="https://checkout.kuickpay.com/kuickpay-checkout.js"></script>
```
*(Use `http://localhost:3000/kuickpay-checkout.js` during local testing)*

#### 1. Modal Popup Mode
```javascript
KuickPay.open({
  baseUrl: 'http://localhost:3000', // Or production checkout URL
  sessionId: orderSessionId,        // Returned from Step 1
  mode: 'modal',                    // 'modal' popup
  onSuccess: function (data) {
    // data: { orderID, transactionID, amount, currency, responseCode: "00" }
    window.location.href = `/kuickpay-return?orderID=${data.orderID}&transactionID=${data.transactionID}&status=00`;
  },
  onFailed: function (error) {
    alert('Payment failed: ' + error.message);
  },
  onClose: function () {
    console.log('Customer closed the checkout modal');
  }
});
```

#### 2. Inline Embed Mode
Embeds the iframe inside an HTML container on your page:
```html
<div id="kuickpay-container" style="min-height: 620px;"></div>

<script>
KuickPay.open({
  baseUrl: 'http://localhost:3000',
  sessionId: orderSessionId,
  mode: 'inline',
  target: '#kuickpay-container',
  onSuccess: function (data) {
    window.location.href = `/kuickpay-return?orderID=${data.orderID}&transactionID=${data.transactionID}&status=00`;
  },
  onFailed: function (error) {
    alert('Payment failed: ' + error.message);
  }
});
</script>
```

---

### Option B: Using React Components (Pure Next.js / React)

#### 1. Modal Component (`<KuickPayCheckoutModal />`)
```jsx
import KuickPayCheckoutModal from '@/app/components/KuickPayCheckoutModal';

<KuickPayCheckoutModal
  isOpen={isModalOpen}
  sessionId={sessionId}
  baseUrl="http://localhost:3000"
  onClose={() => setIsModalOpen(false)}
  onSuccess={(data) => {
    window.location.href = `/kuickpay-return?orderID=${data.orderID}&transactionID=${data.transactionID}&status=00`;
  }}
  onFailed={(err) => {
    alert(err.message || 'Payment failed');
  }}
/>
```

#### 2. Inline Component (`<KuickPayCheckoutInline />`)
Embeds directly into your layout/card with automatic iframe height resizing:
```jsx
import KuickPayCheckoutInline from '@/app/components/KuickPayCheckoutInline';

<KuickPayCheckoutInline
  sessionId={sessionId}
  baseUrl="http://localhost:3000"
  onClose={() => setInlineVisible(false)}
  onSuccess={(data) => {
    window.location.href = `/kuickpay-return?orderID=${data.orderID}&transactionID=${data.transactionID}&status=00`;
  }}
  onFailed={(err) => {
    alert(err.message || 'Payment failed');
  }}
/>
```

---

## 6. postMessage Event Reference
All iframe events dispatch the following JSON payload to `window.parent`:

| Event Name | Description | Payload |
|---|---|---|
| `KUICKPAY_READY` | Iframe finished initial rendering | `{ source: "kuickpay-checkout", type: "KUICKPAY_READY" }` |
| `KUICKPAY_SUCCESS` | Payment processed and approved | `{ source: "kuickpay-checkout", type: "KUICKPAY_SUCCESS", orderID, transactionID, amount, currency, responseCode: "00" }` |
| `KUICKPAY_FAILED` | Card declined or transaction rejected | `{ source: "kuickpay-checkout", type: "KUICKPAY_FAILED", message }` |
| `KUICKPAY_CLOSE` | Customer clicked close / backdrop | `{ source: "kuickpay-checkout", type: "KUICKPAY_CLOSE" }` |
| `KUICKPAY_ERROR` | Session or network failure | `{ source: "kuickpay-checkout", type: "KUICKPAY_ERROR", message }` |

---

## Security Best Practices
- **Never expose your Secured Key** on the frontend. Perform session creation and transaction inquiry on your backend server.
- **Validate the Amount** on the return page to ensure it matches your records.
- **Use HTTPS** for all API communication.

