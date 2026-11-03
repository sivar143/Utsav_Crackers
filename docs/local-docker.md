# Run Utsav Crackers locally with Docker

This is the simplest full-stack local setup. Docker Compose builds and runs Angular, Spring Boot, MySQL, Keycloak, and Keycloak's PostgreSQL database. No AWS account, cloud server, Java installation, Node installation, or locally installed database is required. Install Docker Desktop with its Compose support.

## 1. Configure local credentials

From the repository root, create your private local environment file:

**Windows PowerShell**
```powershell
Copy-Item .env.local.example .env.local
```

The local template is intentionally configured with these development-only credentials:

| Service | Username | Password |
|---|---|---|
| MySQL application account | `utsav_app` | `mysql` |
| MySQL root | `root` | `root` |
| Keycloak administrator | `admin` | `admin` |
| Keycloak PostgreSQL account | `keycloak` | `keycloakdb` |

The actual `.env.local` file is ignored by Git. The example template is committed so the setup is repeatable. These simple credentials are only for a developer's local machine; do not use them for staging, production, or an internet-accessible server.

## 2. Build and start the complete application

Run these commands from the repository root:

```powershell
docker compose --env-file .env.local -f compose.local.yml config
docker compose --env-file .env.local -f compose.local.yml up -d --build
```

The first build downloads base images and compiles the frontend and backend, so it can take several minutes. Check container status and startup logs:

```powershell
docker compose --env-file .env.local -f compose.local.yml ps
docker compose --env-file .env.local -f compose.local.yml logs -f
```

Wait until MySQL and Keycloak are healthy and the backend and frontend have started.

## 3. Open the local services

- **Angular application:** http://localhost:4200
- **Keycloak login/admin console:** http://localhost:8081
- **Spring Boot API and health endpoint:** http://localhost:8080/actuator/health
- **MySQL:** localhost:3306

Sign in to the Keycloak administration console with username `admin` and password `admin`. The local `utsav-crackers` realm is imported from `infra/keycloak/realm-export.json`. The Angular app uses the `utsav-web` client. Only the administrator sign-in action redirects to the Keycloak-hosted login page; customers use the storefront's own account forms. Angular API calls under `/api/` are reverse-proxied by Nginx to the backend container.

## 4. Customer registration, customer sign-in, and administrator access

The storefront provides its own customer registration and sign-in forms. Customers do not use the Keycloak-hosted login page:

- Registration is posted to `/api/v1/auth/customer/register`. The backend creates the Keycloak identity, assigns only the `CUSTOMER` realm role, and stores the Keycloak subject alongside the customer profile in MySQL.
- Customer sign-in is posted to `/api/v1/auth/customer/login`. The backend validates the credentials with the Keycloak token endpoint and returns a short-lived access token plus refresh token. Tokens are kept in browser memory and refreshed through the backend; a full page reload signs the customer out.
- Customer addresses are stored against the authenticated Keycloak subject. Customers can add, edit, delete, and choose a default address.
- The `/api/v1/admin/**` endpoints require the `ADMIN` realm role. Hiding admin controls in the UI is not the security boundary; the backend enforces the role.

**Existing local Keycloak database:** Realm JSON is imported only when the Keycloak database is first initialized. Since you already started Keycloak, open http://localhost:8081, sign in to the master administration console, select the `utsav-crackers` realm, then open **Clients → utsav-web → Capability config** and enable **Direct access grants**. Save the client. This enables the backend-mediated customer login API; customers still use the storefront form and are not redirected to the Keycloak login page.

**Create the application administrator once:** In the `utsav-crackers` realm, open **Users → Create new user**. Create a dedicated administrator user, enable it, set a password under **Credentials**, then open **Role mapping → Assign role** and assign the realm role `ADMIN`. Use this account with the **Administrator sign in** button on the storefront. The master-realm console administrator is not automatically an application administrator.

The local backend uses the local Keycloak bootstrap administrator credentials from `.env.local` to provision customers. They are passed only to the backend container and must remain local-only. For a real deployment, replace this with a dedicated Keycloak service account restricted to the minimum user-management and role-assignment permissions. The custom storefront password form uses Keycloak Direct Access Grants (password grant); this legacy OAuth flow is not recommended for public production systems. Before production, replace it with a BFF-based Authorization Code + PKCE flow and a branded Keycloak theme or another supported identity flow, without exposing Keycloak administrative credentials to the browser.

## 5. Useful commands

Run from the repository root, using the same Compose options:

```powershell
# Follow logs for one service
docker compose --env-file .env.local -f compose.local.yml logs -f backend

# Rebuild after changing frontend or backend source
docker compose --env-file .env.local -f compose.local.yml up -d --build

# Stop containers but preserve database data
docker compose --env-file .env.local -f compose.local.yml down

# Stop containers AND permanently delete the local database volumes
docker compose --env-file .env.local -f compose.local.yml down -v
```

The last command deletes local MySQL and Keycloak database data. Use it only when you intentionally want a completely fresh local environment. After deleting the Keycloak database volume, the realm import runs again on the next startup.

## 6. Troubleshooting

- If Docker reports that ports 3306, 4200, 8080, or 8081 are already in use, stop the other process or change the corresponding host-side port in `compose.local.yml`.
- If you change a database password after the database volume has already been initialized, the new environment value does not rewrite the existing database user's password. For a disposable fresh local database, run `down -v` and start the stack again.
- If Keycloak login reports an issuer mismatch, verify that Keycloak's discovery document at http://localhost:8081/realms/utsav-crackers/.well-known/openid-configuration reports issuer `http://localhost:8081/realms/utsav-crackers`. The backend uses that issuer for token validation and the internal Docker network address for downloading signing keys.
- To inspect an individual service, use `docker compose --env-file .env.local -f compose.local.yml logs -f <service>`, where service is `mysql`, `keycloak-db`, `keycloak`, `backend`, or `frontend`.

## Separation from deployment environments

Use `compose.local.yml` only for the full local stack. It does not replace or modify `compose.dev.yml`, `compose.staging.yml`, or `compose.prod.yml`. Local credentials and local database volumes are separate from staging and production configuration.


## Customer one-time-code sign-in

Customer sign-in and account creation use the storefront's email or phone one-time-code flow. A customer profile and Keycloak CUSTOMER identity are provisioned by the backend after a valid code is verified.

Configure at least one delivery provider in your local `.env.local` before testing OTP sign-in:

- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM`.
- SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`.

Restart/rebuild the backend after changing these values. Do not commit `.env.local` or use local development credentials in production. OTPs expire after five minutes, are limited to five verification attempts, and are rate-limited per contact.

The cart is opened from the header cart icon. Checkout checks for a saved address and opens the address form when none exists. This iteration validates the address step; order placement, payment collection, and final shipping quotation require the subsequent order/checkout integration.
