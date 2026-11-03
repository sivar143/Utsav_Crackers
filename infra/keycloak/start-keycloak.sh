#!/usr/bin/env bash
set -Eeuo pipefail

# Start Keycloak normally, then reconcile the existing persistent realm's
# customer OIDC client. Realm import only creates missing realms; it does not
# update clients in an already-initialized database.
/opt/keycloak/bin/kc.sh start-dev --import-realm --http-port=8080 &
KEYCLOAK_PID=$!

cleanup() {
  kill "$KEYCLOAK_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

KCADM=/opt/keycloak/bin/kcadm.sh
REALM="${KEYCLOAK_REALM:-utsav-crackers}"
ADMIN_USER="${KC_BOOTSTRAP_ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${KC_BOOTSTRAP_ADMIN_PASSWORD:-}"

if [[ -z "$ADMIN_PASSWORD" ]]; then
  echo "KEYCLOAK_ADMIN_PASSWORD is required to reconcile the customer OIDC client." >&2
  wait "$KEYCLOAK_PID"
  exit 1
fi

echo "Waiting for Keycloak before reconciling the $REALM/utsav-web client..."
AUTHENTICATED=false
for attempt in $(seq 1 60); do
  if "$KCADM" config credentials --server http://localhost:8080 --realm master \
      --user "$ADMIN_USER" --password "$ADMIN_PASSWORD" >/dev/null 2>&1; then
    AUTHENTICATED=true
    break
  fi
  if ! kill -0 "$KEYCLOAK_PID" 2>/dev/null; then
    echo "Keycloak exited before becoming ready." >&2
    wait "$KEYCLOAK_PID"
    exit 1
  fi
  sleep 5
done

if [[ "$AUTHENTICATED" != true ]]; then
  echo "Could not authenticate to Keycloak admin API; customer client was not reconciled." >&2
  wait "$KEYCLOAK_PID"
  exit 1
fi

CLIENT_ID=""
for attempt in $(seq 1 12); do
  CLIENT_ID=$("$KCADM" get clients -r "$REALM" -q "clientId=utsav-web" 2>/dev/null \
    | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1 || true)
  [[ -n "$CLIENT_ID" ]] && break
  sleep 5
done

if [[ -z "$CLIENT_ID" ]]; then
  echo "Could not find the utsav-web client in realm $REALM." >&2
  wait "$KEYCLOAK_PID"
  exit 1
fi

"$KCADM" update "clients/$CLIENT_ID" -r "$REALM" \
  -s enabled=true \
  -s publicClient=true \
  -s directAccessGrantsEnabled=true \
  -s standardFlowEnabled=true \
  -s implicitFlowEnabled=false

echo "Reconciled $REALM/utsav-web: public client, Direct Access Grants enabled."
# Compose must not start the backend until this configuration is complete.
touch /tmp/utsav-client-configured
wait "$KEYCLOAK_PID"
