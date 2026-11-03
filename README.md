# Utsav Crackers

A production-oriented fireworks e-commerce platform.

## Planned technology stack

- **Frontend:** Angular, TypeScript, Bootstrap
- **Backend:** Java and Spring Boot
- **Database:** MySQL
- **Identity and access:** Keycloak with Admin and Customer roles
- **Edge/reverse proxy:** Nginx
- **Local infrastructure:** Docker Compose
- **Payments:** A real UPI-capable payment provider (Razorpay or Cashfree), with server-side verification, signed webhook validation, and idempotent processing

## Product scope

The platform is intended to cover customer registration and login, product catalogue and pricing, cart and checkout, compliant location-aware availability and delivery rules, payment processing, inventory, order fulfilment, delivery tracking, promotions, customer order history, notifications, audit trails, and administrative reporting.

Fireworks-specific sales, storage, and transportation restrictions must be enforced by the backend using configurable jurisdiction and delivery rules. The application must not imply that a product can be sold or shipped to a location unless the applicable rules have been validated.

## Engineering principles

- Do not simulate successful payments. Orders are paid only after verified provider confirmation.
- Verify payment webhook signatures and make webhook processing idempotent.
- Enforce authorization on the backend, not only in the UI.
- Keep secrets out of source control and provide environment-based configuration.
- Include automated tests, health checks, database migrations, and operational documentation.
- Keep development and production Compose configurations separate.
- Nginx is a reverse proxy, not an authentication provider; Keycloak handles identity.
- Prefer auditable order, inventory, payment, and fulfilment state transitions.

## Repository workflow

Application development is intended to take place on the `collaborators` branch. The `main` branch is reserved for the repository's stable baseline and reviewed releases.

## Status

Initial repository bootstrap. Implementation and detailed architecture are to be developed incrementally, with tests and documentation accompanying each feature.
