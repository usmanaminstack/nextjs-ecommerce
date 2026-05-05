# KuickPay Merchant Integration Guide

This guide outlines the technical steps required to integrate the KuickPay Checkout Gateway into your e-commerce platform.

## 1. Prerequisites

Before starting, ensure you have the following credentials provided by KuickPay:
- **Company ID**: Your unique merchant identifier.
- **Secured Key**: A secret key used for request signing and authentication.
- **Gateway Endpoint**: The base URL for the KuickPay API (Sandbox or Production).

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

**Note:** You should always verify the payment status on your server by calling the Transaction Inquiry API (if available) before fulfilling the order.

---

## Security Best Practices
- **Never expose your Secured Key** on the frontend. Perform session creation on your backend server.
- **Validate the Amount** on the return page to ensure it matches your records.
- **Use HTTPS** for all API communication.
