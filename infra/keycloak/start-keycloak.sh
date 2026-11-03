#!/bin/sh
set -eu

# Start Keycloak, then reconcile the existing persistent realm's customer
# OIDC client. Realm import does not update clients in an initialized database.
/opt/keycloak/bin/kc.sh start-dev --import-realm --http-port=8080 &
KEYCLOAK_PID=$!

cleanup() {
  kill "$KEYCLOAK_PID" 2>/dev/null || true
}
trap cleanup EXIT HUP INT TERM

KCADM=/opt/keycloak/bin/kcadm.sh
REALM=${KEYCLOAK_REALM:-utsav-crackers}
ADMIN_USER=${KC_BOOTSTRAP_ADMIN_USERNAME:-admin}
ADMIN_PASSWORD=${KC_BOOTSTRAP_ADMIN_PASSWORD:-}

if [ -z "$ADMIN_PASSWORD" ]; then
  echo "KC_BOOTSTRAP_ADMIN_PASSWORD is required to reconcile the customer OIDC client." >&2
  wait "$KEYCLOAK_PID"
  exit 1
fi

echo "Waiting for Keycloak before reconciling the $REALM/utsav-web client..."
AUTHENTICATED=0
attempt=1
while [ "$attempt" -le 60 ]; do
  if "$KCADM" config credentials --server http://localhost:8080 --realm master \
      --user "$ADMIN_USER" --password "$ADMIN_PASSWORD" >/dev/null 2>&1; then
    AUTHENTICATED=1
    break
  fi
  if ! kill -0 "$KEYCLOAK_PID" 2>/dev/null; then
    echo "Keycloak exited before becoming ready." >&2
    wait "$KEYCLOAK_PID"
    exit 1
  fi
  sleep 5
  attempt=$((attempt + 1))
done

if [ "$AUTHENTICATED" -ne 1 ]; then
  echo "Could not authenticate to Keycloak admin API; customer client was not reconciled." >&2
  wait "$KEYCLOAK_PID"
  exit 1
fi

CLIENT_ID=""
attempt=1
while [ "$attempt" -le 12 ]; do
  CLIENT_ID=$("$KCADM" get clients -r "$REALM" -q "clientId=utsav-web" 2>/dev/null \
    | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' | head -n 1) || true
  if [ -n "$CLIENT_ID" ]; then
    break
  fi
  sleep 5
  attempt=$((attempt + 1))
done

if [ -z "$CLIENT_ID" ]; then
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
