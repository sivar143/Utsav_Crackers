# Cash on delivery

Customer checkout currently supports **Cash on Delivery (COD) only**. No online payment gateway is configured or called by the application.

## Checkout flow

- The customer signs in with an email one-time code.
- The customer selects a saved delivery address.
- The backend checks the address against the approved fireworks jurisdiction policy and revalidates cart stock and prices.
- The backend stores an order snapshot with payment method `COD` and payment status `PENDING`, then clears the cart.
- The customer pays the order total when the order is delivered.
- The administrator sees COD orders in the delivery queue. When the delivery status is changed to `DELIVERED`, the order payment status is marked `PAID`.

## API

- `POST /api/v1/customer/orders` — requires a customer bearer token. Body: `{ "addressId": "<saved-address-uuid>" }`. The backend derives prices and item details from the stored cart; client-supplied totals are not accepted.
- `GET /api/v1/admin/deliveries` — lists active paid orders and COD orders that have not been delivered.
- `PUT /api/v1/admin/deliveries/{orderId}/status` — updates delivery state to `PENDING`, `PACKED`, `DISPATCHED`, or `DELIVERED`.

## Email OTP configuration

Customer verification codes are sent by email. Configure these variables in your private `.env.local` file:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=
```

No SMS provider or phone OTP configuration is used. Phone numbers remain part of delivery addresses for courier/customer contact.
