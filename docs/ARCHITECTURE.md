# Architecture baseline

## System boundaries

- **Angular** serves the customer storefront and protected administration workflows.
- **Spring Boot** owns business rules, authorization, pricing, stock reservations, order transitions, payment state, and delivery eligibility.
- **MySQL** stores transactional commerce data; Flyway manages schema changes.
- **Keycloak** provides OIDC identity and role claims. The API validates access tokens.
- **Nginx** is the deployment edge reverse proxy, not an authentication provider.
- **Payment provider** integration is server-to-server. Browser redirects are never proof of payment.

## Core modules

1. Customer identity and profiles
2. Product catalogue, categories, pricing, and media
3. Inventory ledger, stock movements, and reservations
4. Cart, checkout, and order lifecycle
5. Payment intents, provider events, refunds, and reconciliation
6. Fireworks compliance and location-based fulfilment eligibility
7. Shipment, delivery, and proof of delivery
8. Promotions, notifications, audit events, and reporting

## Critical invariants

- Use decimal monetary values with explicit currency codes.
- Record stock changes as auditable movements and prevent overselling.
- Validate order and payment state transitions server-side.
- Verify payment webhook signatures; use replay protection and idempotent event handling.
- Enforce customer ownership and admin authorization in the API.
- Validate delivery eligibility before checkout and again before dispatch.
- Never fabricate payment, compliance, inventory, or shipment outcomes in the UI.

## Local development

Copy `.env.example` to `.env` for reference, replace all sample credentials, then start dependencies with `docker compose -f compose.dev.yml up -d`. Run the API with Java 21 and Maven from `backend`, and the web app with Node.js and npm from `frontend`. Production deployment configuration will be kept separate.
