# Deployment baseline

## Production prerequisites

- A Linux Docker host with Docker Compose v2.
- A DNS name whose A/AAAA records point to the host.
- Valid TLS certificate and private key files.
- A reviewed production Keycloak realm/client configuration. The local realm export is intentionally not mounted in production.
- Unique, high-entropy database and Keycloak administrator passwords stored outside source control.
- A reviewed legal/compliance configuration for every jurisdiction where fireworks products may be offered or delivered.

## Configure and start

1. Copy `.env.production.example` to `.env.production`.
2. Set `PUBLIC_BASE_URL` to the public HTTPS origin without a trailing slash.
3. Set `TLS_CERT_DIR` to a host directory containing `fullchain.pem` and `privkey.pem`.
4. Replace every password and administrator placeholder. Never commit `.env.production` or TLS private keys.
5. Configure the production Keycloak realm `utsav-crackers`, the public client `utsav-web`, exact redirect URIs for `PUBLIC_BASE_URL`, PKCE S256, and the `ADMIN`/`CUSTOMER` realm roles.
6. Validate and start:

```bash
docker compose --env-file .env.production -f compose.prod.yml config --quiet
docker compose --env-file .env.production -f compose.prod.yml up -d --build
```

Only Nginx publishes host ports 80 and 443. MySQL, PostgreSQL, Keycloak, and the API remain on private Compose networks. Nginx terminates TLS and routes `/api/`, `/auth/`, and storefront requests to their respective services.

## Important release gates

- The production Keycloak realm is not auto-imported. Configure and review it before enabling sign-in.
- The application currently has no payment provider, inventory reservation, or fireworks jurisdiction engine. Do not accept payments or represent stock/delivery eligibility as confirmed until those modules are implemented and reviewed.
- Configure off-host encrypted backups for both database volumes and test restore procedures before production use.
- Use a managed secret store in the deployment environment where available. Do not rely on committed example values.
- Review TLS renewal, firewall policy, database resource limits, log retention, monitoring, and incident procedures before public launch.

The production Compose file is intentionally separate from `compose.dev.yml`; local Keycloak `start-dev` and its sample realm are never used in production.
