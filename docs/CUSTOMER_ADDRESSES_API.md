# Customer address book API

Every endpoint requires a Keycloak bearer token with the `CUSTOMER` or `ADMIN` realm role. The customer owner is derived from the token subject; request bodies cannot select or change ownership.

## Endpoints

- `GET /api/v1/customer/addresses` — list addresses belonging to the signed-in customer.
- `POST /api/v1/customer/addresses` — create an address; the first saved address becomes the default.
- `PUT /api/v1/customer/addresses/{id}` — update an address owned by the signed-in customer.
- `PUT /api/v1/customer/addresses/{id}/default` — make an owned address the default.
- `DELETE /api/v1/customer/addresses/{id}` — delete an owned address; deleting the default promotes the next saved address when one exists.

The current release accepts Indian addresses only: country code `IN`, an Indian state/UT code such as `IN-AP`, and a six-digit PIN code. Phone numbers use international E.164-style notation. Address ownership is checked on every read or mutation.

## Compliance boundary

Saving an address does not mean fireworks can legally be sold or delivered there. The future checkout and dispatch flows must independently evaluate the current laws, product restrictions, PIN-code jurisdiction, carrier capabilities, and any required permits before confirming an order.
