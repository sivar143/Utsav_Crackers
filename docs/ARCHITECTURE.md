# Architecture baseline

## System boundaries

- **Angular** serves the customer storefront and protected administration workflows.
- **Spring Boot** owns business rules, authorization, pricing, stock reservations, order transitions, payment state, and delivery eligibility.
- **MySQL** stores transactional commerce data; Flyway manages schema changes.
- **Keycloak** provides OIDC identity and realm roles. The API validates bearer JWTs and maps the `ADMIN` and `CUSTOMER` realm roles to Spring authorities.
- **Nginx** is the deployment edge reverse proxy and TLS terminator in production, not an authentication provider. The production Compose file keeps databases and application services on private networks.
- **Checkout** currently supports cash on delivery. Orders remain payment-pending until delivery is completed and cash collection is recorded.

## Authentication baseline

- Local Keycloak realm import is stored in `infra/keycloak/realm-export.json`.
- The browser client is a public OIDC client using authorization-code flow with PKCE S256; direct access grants and implicit flow are disabled.
- Angular uses Keycloak check-sso mode so public catalogue browsing remains available to guests. Its HTTP interceptor attaches refreshed bearer tokens only to relative same-origin `/api/` requests.
- The current Keycloak URL in the Angular client is a local-development value. Production must supply the identity-provider URL through reviewed deployment runtime configuration before release.
- The API uses the realm issuer URL from `KEYCLOAK_ISSUER_URI`.
- `/api/v1/health` and actuator health are public. `/api/v1/admin/**` requires `ADMIN`; `/api/v1/customer/**` requires `CUSTOMER` or `ADMIN`; other versioned API routes require authentication.
- Customer ownership checks must still be implemented in each application service. A role is not proof of ownership.
- Production must use HTTPS, restricted redirect origins, managed secrets, and a separately reviewed Keycloak configuration. The local realm is not production-ready.

## Core modules

1. Customer identity and profiles
2. Product catalogue, categories, pricing, and media
3. Inventory ledger, stock movements, and reservations
4. Cart, checkout, and order lifecycle
5. Cash-on-delivery collection and order payment state
6. Fireworks compliance and location-based fulfilment eligibility
7. Shipment, delivery, and proof of delivery
8. Promotions, notifications, audit events, and reporting

## Critical invariants

- Use decimal monetary values with explicit currency codes.
- Record stock changes as auditable movements and prevent overselling.
- Validate order and COD payment state transitions server-side.
- Mark a COD order paid only when delivery is confirmed and cash collection is completed.
- Enforce customer ownership and admin authorization in the API.
- Validate delivery eligibility before checkout and again before dispatch.
- Never fabricate payment, compliance, inventory, or shipment outcomes in the UI.

## Local development

1. Copy `.env.example` to `.env` and replace every sample password.
2. Keep `SPRING_DATASOURCE_PASSWORD` equal to `MYSQL_PASSWORD` in that local file.
3. Start dependencies with `docker compose -f compose.dev.yml up -d`.
4. Run the API from `backend` with Java 21 and Maven; the application reads datasource and Keycloak issuer settings from environment variables.
5. Run the web app from `frontend` with Node.js 22 and npm.

Production deployment uses `compose.prod.yml`, separate application Dockerfiles, and `deploy/nginx/nginx.conf`. The development Compose file uses Keycloak `start-dev` and must never be used as a production deployment.
