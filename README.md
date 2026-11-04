# Utsav Crackers

A production-oriented fireworks e-commerce platform.

## Planned technology stack

- **Frontend:** Angular, TypeScript, Bootstrap
- **Backend:** Java and Spring Boot
- **Database:** MySQL
- **Identity and access:** Keycloak with Admin and Customer roles
- **Edge/reverse proxy:** Nginx
- **Local infrastructure:** Docker Compose
- **Payments:** Cash on Delivery (COD) for the current checkout flow

## Product scope

The platform is intended to cover customer registration and login, product catalogue and pricing, cart and checkout, compliant location-aware availability and delivery rules, payment processing, inventory, order fulfilment, delivery tracking, promotions, customer order history, notifications, audit trails, and administrative reporting.

Fireworks-specific sales, storage, and transportation restrictions must be enforced by the backend using configurable jurisdiction and delivery rules. The application must not imply that a product can be sold or shipped to a location unless the applicable rules have been validated.

## Engineering principles

- COD orders remain pending payment until delivery is confirmed and cash collection is recorded by the delivery workflow.
- Enforce authorization on the backend, not only in the UI.
- Keep secrets out of source control and provide environment-based configuration.
- Include automated tests, health checks, database migrations, and operational documentation.
- Keep development and production Compose configurations separate.
- Nginx is a reverse proxy, not an authentication provider; Keycloak handles identity.
- Prefer auditable order, inventory, payment, and fulfilment state transitions.

## Repository workflow

Application development is intended to take place on the `collaborators` branch. The `main` branch is reserved for the repository's stable baseline and reviewed releases.

## Local Docker deployment

Local Docker deployment is split into three independently deployable stacks. See [`docs/local-docker.md`](docs/local-docker.md) for the complete runbook.

Quick start on Windows PowerShell (run from the repository root):

```powershell
Copy-Item .env.local.example .env.local

# Start databases and Keycloak first
docker compose --env-file .env.local -f compose.local.yml up -d

# Start the backend and frontend independently when required
docker compose --env-file .env.local -f compose.backend.yml up -d --build
docker compose --env-file .env.local -f compose.frontend.yml up -d --build
```

Open the app at http://localhost:4200. You can rebuild or stop either application stack without redeploying the other. Local-only credentials are documented in the runbook; do not reuse them outside a developer machine.

## Cloud deployment

See [`deploy/aws/DEPLOYMENT.md`](deploy/aws/DEPLOYMENT.md) for the AWS EC2 Ubuntu runbook. A private SSH-tunnel-only staging Compose stack is provided for environments without a domain. Public production requires a registered domain, HTTPS certificate, production Keycloak client configuration, and completion of the security, legal, payment, inventory, and fulfilment release gates.

- Development dependencies: `compose.dev.yml`
- Local infrastructure (MySQL and Keycloak): `compose.local.yml`
- Local backend only: `compose.backend.yml`
- Local frontend only: `compose.frontend.yml`
- Private staging: `compose.staging.yml`
- HTTPS production: `compose.prod.yml`
- Environment templates: `.env.local.example`, `.env.staging.example`, and `.env.production.example` (never commit populated env files)

## Status

The application is under active development. Checkout currently supports cash on delivery only; deployment scaffolding is provided, but the platform is not yet ready for real customer orders.
