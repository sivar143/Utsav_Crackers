# Customer cart API

All cart endpoints require a valid Keycloak bearer token with the `CUSTOMER` or `ADMIN` realm role. The cart owner is derived exclusively from the JWT `sub` claim; clients cannot choose another customer identifier.

## Endpoints

- `GET /api/v1/customer/cart` — return the current customer's cart. A customer with no saved cart receives an empty response.
- `PUT /api/v1/customer/cart/items/{productId}` — add a product or replace its quantity. Body: `{"quantity": 2}`.
- `DELETE /api/v1/customer/cart/items/{productId}` — remove a line.
- `DELETE /api/v1/customer/cart` — clear all lines.

Quantities must be between 1 and 99. Only active products can be added. The server reads the current product price and currency from MySQL and calculates each line total and cart subtotal. The cart rejects mixed currencies rather than adding unlike amounts.

## Deliberate checkout boundary

A cart is not an order, stock reservation, compliance approval, payment, or delivery promise. Prices may change before checkout. The future checkout command must revalidate current prices, stock, customer address, jurisdiction-specific fireworks restrictions, and delivery capability before creating an order.
