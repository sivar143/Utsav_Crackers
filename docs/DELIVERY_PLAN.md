# Delivery plan

## Phase 1 — Foundation
- [x] Repository and branch baseline
- [x] Angular and Spring Boot starter projects
- [x] MySQL and Keycloak development dependencies
- [x] API bearer-token security baseline and Keycloak realm/role import
- [x] CI workflow and frontend unit-test target
- [x] Backend tests, MySQL Flyway migration/persistence checks, frontend tests, and production build pass in GitHub Actions
- [x] Separate production Compose, Nginx TLS edge, and application Dockerfiles
- [x] Production and isolated SSH-tunnel staging Keycloak client exports and environment templates
- [x] AWS EC2 Ubuntu deployment and operations runbook
- [ ] Production secret manager integration and TLS renewal automation

## Phase 2 — Catalogue and customer experience
- [x] Product/category persistence and public catalogue APIs
- [x] Admin category and product maintenance APIs and Angular UI
- [x] Customer-facing product catalogue UI and local API proxy
- [x] Persistent customer cart API and Angular cart summary
- [x] Customer-owned Indian address book API and Angular address manager
- [ ] Product images, pricing history, search, and availability
- [ ] Checkout validation

## Phase 3 — Orders, inventory, and compliance
- [x] Inventory balance and append-only adjustment ledger API and admin UI
- [x] Default-deny, source-backed, two-person-approved jurisdiction policy framework, revocation audit, admin UI, and customer address-level eligibility check
- [ ] Product-specific restrictions, storage licensing, and carrier dangerous-goods checks
- [ ] Purchase receiving, lot tracking, and warehouse transfers
- [ ] Stock reservations and order lifecycle
- [ ] Shipment and delivery tracking

## Phase 4 — Payments
- [ ] Select and configure provider credentials
- [ ] Create payment intents server-side
- [ ] Verify signed webhooks and idempotency
- [ ] Refunds, reconciliation, and payment audit trail

## Phase 5 — Operations and hardening
- [ ] Promotions, notifications, and reporting
- [ ] Security review and dependency scanning
- [ ] Integration and end-to-end tests
- [ ] Health checks, backup/restore, and deployment runbooks

Every feature must include migrations, API validation, authorization, tests, and operator documentation. Payment and compliance features must not be enabled in production until provider and legal configurations are reviewed.
