# Run Utsav Crackers locally with separate Docker Compose stacks

The local deployment is split so you can deploy infrastructure, backend, and frontend independently. All three Compose files use the same external Docker network, `utsav-local-network`.

## Compose files

| File | Services |
|---|---|
| `compose.local.yml` | MySQL, Keycloak PostgreSQL, Keycloak |
| `compose.backend.yml` | Spring Boot backend |
| `compose.frontend.yml` | Angular/Nginx frontend |

Start the infrastructure stack first. The backend expects MySQL and Keycloak to be available; the frontend proxies API requests to the backend using its Docker network alias.

## 1. Configure local credentials

From the repository root, create the private local environment file if it does not already exist:

```powershell
Copy-Item .env.local.example .env.local
```

Keep populated credentials in `.env.local`; never commit that file or paste secrets into chat. Configure the SMTP settings there to enable email one-time-code delivery. Checkout currently supports cash on delivery only; no payment gateway or SMS provider is configured. If you already have an older `.env.local`, remove the obsolete `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` entries.

## 2. Start infrastructure

```powershell
docker compose --env-file .env.local -f compose.local.yml config
docker compose --env-file .env.local -f compose.local.yml up -d
docker compose --env-file .env.local -f compose.local.yml ps
```

Wait until `mysql`, `keycloak-db`, and `keycloak` are healthy before starting the backend.

## 3. Start only the backend when needed

```powershell
docker compose --env-file .env.local -f compose.backend.yml config
docker compose --env-file .env.local -f compose.backend.yml up -d --build
docker compose --env-file .env.local -f compose.backend.yml logs -f backend
```

Backend API: http://localhost:8080

## 4. Start only the frontend when needed

```powershell
docker compose --env-file .env.local -f compose.frontend.yml config
docker compose --env-file .env.local -f compose.frontend.yml up -d --build
docker compose --env-file .env.local -f compose.frontend.yml logs -f frontend
```

Storefront: http://localhost:4200

The frontend Nginx configuration proxies `/api/` requests to the `backend` network alias. If the backend is not running, the storefront may load but API calls will fail until you start it.

## 5. Common independent operations

Run commands from the repository root and keep the same `--env-file` and `-f` options:

```powershell
# Rebuild/restart only the backend
docker compose --env-file .env.local -f compose.backend.yml up -d --build

# Rebuild/restart only the frontend
docker compose --env-file .env.local -f compose.frontend.yml up -d --build

# Stop only the backend
docker compose --env-file .env.local -f compose.backend.yml down

# Stop only the frontend
docker compose --env-file .env.local -f compose.frontend.yml down

# Stop infrastructure (backend/frontend should be stopped first)
docker compose --env-file .env.local -f compose.local.yml down

# Follow logs for an individual stack
docker compose --env-file .env.local -f compose.local.yml logs -f keycloak
docker compose --env-file .env.local -f compose.backend.yml logs -f backend
docker compose --env-file .env.local -f compose.frontend.yml logs -f frontend
```

Stopping a stack with `down` preserves its named database volumes. Do not use `down -v` unless you intentionally want to permanently delete the local MySQL and Keycloak database data.

## 6. Ports and services

- Storefront: http://localhost:4200
- Backend API: http://localhost:8080
- Keycloak: http://localhost:8081
- MySQL host port: localhost:3307 (container port 3306)

Keycloak's realm and client startup reconciliation remain configured through `infra/keycloak/start-keycloak.sh`. Existing database volumes are retained; this split does not require deleting or recreating them.

## Troubleshooting

- If a backend or frontend Compose command says the network does not exist, start `compose.local.yml` first. It creates `utsav-local-network`.
- If the backend starts before MySQL or Keycloak is ready, inspect their health/logs and restart the backend after they become healthy.
- If the frontend loads but API calls fail, confirm that the backend container is running and attached to `utsav-local-network`.
- If a port is already occupied, change the host-side port mapping in the relevant Compose file.

## Other environments

These local files do not replace or modify `compose.dev.yml`, `compose.staging.yml`, or `compose.prod.yml`. Keep local credentials and database volumes separate from staging and production.
