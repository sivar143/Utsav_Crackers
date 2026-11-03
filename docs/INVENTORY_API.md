# Inventory ledger API

Inventory endpoints are restricted to the `ADMIN` realm role.

- `GET /api/v1/admin/inventory` — active products and their on-hand, reserved, and available quantities. Products without an inventory balance are returned with zero quantities.
- `GET /api/v1/admin/inventory/{productId}/movements` — append-only movement history for a product.
- `POST /api/v1/admin/inventory/{productId}/adjustments` — apply a signed stock correction. Body: `{"quantityDelta": 25, "reason": "Opening stock"}`.

Positive adjustments add stock; negative adjustments remove stock. Zero adjustments are rejected. The service locks the product and its inventory balance in a transaction, prevents on-hand quantity from falling below reserved quantity, and writes an audit movement with the administrator's token subject.

This first ledger increment does not yet create purchase receipts, supplier lots, stock reservations, sales deductions, returns, or warehouse transfers. Those operations will use dedicated movement types and order references; the balance must never be changed directly by the browser.
