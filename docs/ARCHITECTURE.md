# Architecture baseline

## System boundaries

- **Angular** serves the customer storefront and protected administration workflows.
- **Spring Boot** owns business rules, authorization, pricing, stock reservations, order transitions, payment state, and delivery eligibility.
- **MySQL** stores transactional commerce data; Flyway manages schema changes.
- **Keycloak** provides OIDC identity and realm roles. The API validates bearer JWTs and maps the `ADMIN` and `CUSTOMER` realm roles to Spring authorities.
- **Nginx** is the deployment edge reverse proxy, not an authentication provider.
- **Payment provider** integration is server-to-server. Browser redirects are never proof of payment.

## Authentication baseline

- Local Keycloak realm import is stored in `infra/keycloak/realm-export.json`.
- The browser client is a public OIDC client using authorization-code flow with PKCE S256; direct access grants and implicit flow are disabled.
- The API uses the realm issuer URL from `KEYCLOAK_ISSUER_URI`.
- `/api/v1/health` and actuator health are public. `/api/v1/admin/**` requires `ADMIN`; `/api/v1/customer/**` requires `CUSTOMER` or `ADMIN`; other versioned API routes require authentication.
- Customer ownership checks must still be implemented in each application service. A role is not proof of ownership.
- Production must use HTTPS, restricted redirect origins, managed secrets, and a separately reviewed Keycloak configuration. The local realm is not production-ready.

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

1. Copy `.env.example` to `.env` and replace every sample password.
2. Keep `SPRING_DATASOURCE_PASSWORD` equal to `MYSQL_PASSWORD` in that local file.
3. Start dependencies with `docker compose -f compose.dev.yml up -d`.
4. Run the API from `backend` with Java 21 and Maven; the application reads datasource and Keycloak issuer settings from environment variables.
5. Run the web app from `frontend` with Node.js 22 and npm.

Production deployment configuration will be kept separate. The development Compose file uses Keycloak `start-dev` and must never be used as a production deployment.
