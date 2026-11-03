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

Sign in to the Keycloak administration console with username `admin` and password `admin`. The local `utsav-crackers` realm is imported from `infra/keycloak/realm-export.json`. The Angular app uses the `utsav-web` client and redirects to the local Keycloak URL. Angular API calls under `/api/` are reverse-proxied by Nginx to the backend container.

## 4. Useful commands

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

## 5. Troubleshooting

- If Docker reports that ports 3306, 4200, 8080, or 8081 are already in use, stop the other process or change the corresponding host-side port in `compose.local.yml`.
- If you change a database password after the database volume has already been initialized, the new environment value does not rewrite the existing database user's password. For a disposable fresh local database, run `down -v` and start the stack again.
- If Keycloak login reports an issuer mismatch, verify that Keycloak's discovery document at http://localhost:8081/realms/utsav-crackers/.well-known/openid-configuration reports issuer `http://localhost:8081/realms/utsav-crackers`. The backend uses that issuer for token validation and the internal Docker network address for downloading signing keys.
- To inspect an individual service, use `docker compose --env-file .env.local -f compose.local.yml logs -f <service>`, where service is `mysql`, `keycloak-db`, `keycloak`, `backend`, or `frontend`.

## Separation from deployment environments

Use `compose.local.yml` only for the full local stack. It does not replace or modify `compose.dev.yml`, `compose.staging.yml`, or `compose.prod.yml`. Local credentials and local database volumes are separate from staging and production configuration.
