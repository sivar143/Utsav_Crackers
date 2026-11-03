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

## Local Docker deployment

For a complete local deployment of the Angular frontend, Spring Boot backend, MySQL, and Keycloak (with its PostgreSQL database), follow [`docs/local-docker.md`](docs/local-docker.md).

Quick start on Windows PowerShell:

```powershell
Copy-Item .env.local.example .env.local
docker compose --env-file .env.local -f compose.local.yml up -d --build
```

Open the app at http://localhost:4200. Local-only credentials are documented in the runbook; do not reuse them outside a developer machine.

## Cloud deployment

See [`deploy/aws/DEPLOYMENT.md`](deploy/aws/DEPLOYMENT.md) for the AWS EC2 Ubuntu runbook. A private SSH-tunnel-only staging Compose stack is provided for environments without a domain. Public production requires a registered domain, HTTPS certificate, production Keycloak client configuration, and completion of the security, legal, payment, inventory, and fulfilment release gates.

- Development dependencies: `compose.dev.yml`
- Full local application: `compose.local.yml`
- Private staging: `compose.staging.yml`
- HTTPS production: `compose.prod.yml`
- Environment templates: `.env.local.example`, `.env.staging.example`, and `.env.production.example` (never commit populated env files)

## Status

The application is under active development. Deployment scaffolding is provided, but the platform is not yet ready for real customer orders or payments.
