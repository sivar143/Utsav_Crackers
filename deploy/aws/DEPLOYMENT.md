# AWS EC2 deployment runbook

This runbook targets Ubuntu 24.04 LTS on an AWS EC2 instance. It provides a private, SSH-tunnel-only staging deployment while a domain is not yet registered, followed by the HTTPS production deployment. Do not treat the HTTP staging setup as a public production environment.

## 1. Create AWS infrastructure

1. Create an EC2 instance using Ubuntu Server 24.04 LTS (64-bit x86) and an instance type with at least 4 vCPU and 8 GiB RAM for an initial staging environment. Reassess sizing with load tests before launch.
2. Allocate and associate an Elastic IP. This keeps the public address stable while DNS is being prepared.
3. Use an encrypted gp3 EBS volume (start at 100 GiB; monitor free space and IOPS).
4. Create or select an EC2 key pair. Keep the private key outside the repository and restrict its local permissions.
5. Attach an instance role only if required for operational integrations (for example, SSM or backups); follow least privilege.
6. Security group inbound rules:
   - TCP 22 from your fixed administrator IP only (prefer AWS Systems Manager Session Manager instead of public SSH).
   - Do not open 3306, 5432, 8080, 8081, 8088, or 9000.
   - For SSH-tunnel-only staging, do not open 80 or 443.
   - After domain and TLS are configured, allow TCP 80 and 443 from the internet; keep SSH restricted.
7. Enable EBS encryption, instance detailed monitoring, CloudWatch alarms for CPU, status checks and disk usage (use an agent for disk metrics), and automatic security updates.

## 2. Install Docker

Connect to the instance:

```bash
ssh -i /path/to/key.pem ubuntu@EC2_ELASTIC_IP
```

Clone the repository and install Docker:

```bash
sudo mkdir -p /opt/utsav
sudo chown ubuntu:ubuntu /opt/utsav
git clone --branch collaborators https://github.com/sivar143/Utsav_Crackers.git /opt/utsav
cd /opt/utsav
chmod +x deploy/aws/bootstrap-ubuntu.sh
./deploy/aws/bootstrap-ubuntu.sh
```

Log out and reconnect if required by package updates. Confirm `docker --version` and `docker compose version`.

## 3. Private staging without a domain

This is intentionally available only through an SSH tunnel. It uses HTTP on the loopback interface and staging-only Keycloak redirect URIs. Use synthetic data and test accounts only; never enter real customer information, passwords reused elsewhere, payment credentials, or real orders.

```bash
cd /opt/utsav
cp .env.staging.example .env.staging
chmod 600 .env.staging
nano .env.staging
```

Replace every `REPLACE_...` value with a different randomly generated secret. Keep `PUBLIC_BASE_URL=http://localhost:8088` for the SSH-tunnel workflow. Generate secrets, for example, with `openssl rand -base64 36`; do not reuse values between services.

Validate and launch with a dedicated Compose project name so staging volumes cannot be confused with production:

```bash
docker compose -p utsav-staging --env-file .env.staging -f compose.staging.yml config
docker compose -p utsav-staging --env-file .env.staging -f compose.staging.yml build
docker compose -p utsav-staging --env-file .env.staging -f compose.staging.yml up -d
docker compose -p utsav-staging --env-file .env.staging -f compose.staging.yml ps
```

From your Windows/macOS/Linux workstation, open a second terminal and create the tunnel:

```bash
ssh -i /path/to/key.pem -L 8088:127.0.0.1:8088 ubuntu@EC2_ELASTIC_IP
```

Open `http://localhost:8088` in the workstation browser. Keycloak is available under `/auth`. The staging realm is imported on initial Keycloak startup; if the realm already exists, changing the JSON file does not overwrite it. Back up Keycloak before any manual realm changes.

## 4. Register a domain before public production

A public HTTPS deployment needs a domain you control. Register one with a registrar, create an A record for the apex name (and optionally `www`) pointing to the EC2 Elastic IP, and wait for DNS propagation. Do not use the raw EC2 IP for customer login or payment flows.

Create a production TLS certificate using an approved ACME client after DNS is live. Store the certificate and private key outside the repository, readable by the Docker host, with private-key permissions restricted. The production Compose file mounts the directory configured by `TLS_CERT_DIR` and expects `fullchain.pem` and `privkey.pem`.

## 5. Configure production realm and secrets

```bash
cd /opt/utsav
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
nano infra/keycloak/realm-prod.json
```

Replace `REPLACE_WITH_YOUR_DOMAIN` in the realm export with the exact HTTPS hostname (no path or trailing slash). Set `PUBLIC_BASE_URL=https://your-domain` and `TLS_CERT_DIR=/opt/utsav/tls`. Generate unique secrets for MySQL application/root, Keycloak database, and Keycloak bootstrap administrator. Never commit `.env.production`.

The production realm is imported only when the realm does not already exist. For an existing realm, update its client redirect URIs and web origins in the Keycloak Admin Console or through a reviewed realm migration; editing the import JSON alone is not an update mechanism. Create a named application administrator and customer test account, assign realm roles deliberately, and disable/remove temporary bootstrap access after verifying recovery access.

## 6. Validate and deploy production

Do not expose the production stack until security review, legal/compliance review, payment provider integration, stock/order lifecycle, backups and restore tests, and operational monitoring are complete. The current product is still under development; production Compose being available does not mean the business workflows are production-ready.

```bash
docker compose --env-file .env.production -f compose.prod.yml config
docker compose --env-file .env.production -f compose.prod.yml build
docker compose --env-file .env.production -f compose.prod.yml up -d
docker compose --env-file .env.production -f compose.prod.yml ps
docker compose --env-file .env.production -f compose.prod.yml logs --tail=200
```

Verify:
- `https://your-domain/` serves the storefront and redirects HTTP to HTTPS.
- `https://your-domain/api/v1/health` reports healthy.
- `https://your-domain/auth/realms/utsav-crackers/.well-known/openid-configuration` returns the expected issuer.
- Browser login/logout works with exact HTTPS redirect URIs.
- Backend rejects unauthenticated and insufficient-role requests.
- Database migrations complete and data persists across container recreation.
- No database, Keycloak management, or application port is reachable directly from the public internet.

## 7. Operations and recovery

- Use encrypted off-instance backups for MySQL and Keycloak PostgreSQL; do not store the only backup on the EC2 EBS volume.
- Perform scheduled restore drills into isolated databases and document recovery time and recovery point objectives.
- Monitor EC2 status, disk space, container health, TLS expiry, application errors, database capacity, and backup age.
- Apply OS and image updates deliberately; pin and review image versions/digests and run CI before deployment.
- Deploy reviewed commits from `collaborators`; do not deploy unreviewed working changes.
- Keep secrets in AWS Secrets Manager or SSM Parameter Store for a hardened production rollout rather than long-lived plaintext files where feasible.
- Do not enable real payments or fulfilment until provider signatures, idempotency, reconciliation, location-specific legal rules, dangerous-goods carrier controls, inventory reservations and order state transitions are implemented and audited.

## 8. Useful commands

```bash
# Staging logs
docker compose -p utsav-staging --env-file .env.staging -f compose.staging.yml logs -f

# Staging stop (preserves data volumes)
docker compose -p utsav-staging --env-file .env.staging -f compose.staging.yml down

# Staging stop and delete ALL staging data — destructive, use only intentionally
docker compose -p utsav-staging --env-file .env.staging -f compose.staging.yml down -v
```
