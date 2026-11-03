# Razorpay checkout and payments

The customer checkout supports Razorpay Standard Checkout with UPI or card as the selected payment instrument.

## Local configuration

Copy the three values from the Razorpay **Test Mode** dashboard into the private `.env.local` file (never commit that file):

```dotenv
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

The backend reads these through environment variables. The key secret and webhook secret are server-only; the frontend receives only the publishable key ID as part of the server-created order response.

## API

- `POST /api/v1/customer/payments/orders` — requires a customer bearer token. Body: `{ "addressId": "<saved-address-uuid>", "paymentMethod": "UPI" | "CARD" }`. The server recalculates the cart total from catalogue prices, checks the saved address against the current approved fireworks jurisdiction policy, verifies available inventory, persists an order snapshot and creates a Razorpay order.
- `POST /api/v1/customer/payments/verify` — requires a customer bearer token. Body contains Razorpay's `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. The server verifies the signature and fetches the payment from Razorpay; it marks the order paid and clears the cart only when the payment is captured for the exact expected amount and currency.
- `POST /api/v1/customer/payments/webhook` — public endpoint protected by the `X-Razorpay-Signature` HMAC header. Configure the Razorpay webhook for the `payment.captured` event and use the webhook secret configured above. The webhook is an additional server-to-server reconciliation path.

## Important checkout safeguards

- Never trust a total supplied by the browser.
- Never mark an order paid from the browser callback alone.
- Do not retry a payment if the bank shows a debit but the storefront cannot confirm it; reconcile using the Razorpay payment reference.
- A valid approved jurisdiction policy and sufficient inventory are required before the payment order is created.
- Payment credentials must remain in the private environment file or secret manager. Use Test Mode keys during local testing; switch to Live Mode only after merchant onboarding and end-to-end verification.

## Local webhook testing

Razorpay cannot call a private `localhost` endpoint directly. For webhook testing, expose the local backend through a secure HTTPS tunnel and register the resulting public URL ending in `/api/v1/customer/payments/webhook` in the Razorpay dashboard. Do not expose the MySQL or Keycloak ports through that tunnel.
