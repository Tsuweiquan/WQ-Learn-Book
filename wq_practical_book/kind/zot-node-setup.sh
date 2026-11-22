#!/usr/bin/env bash
# Run after a reboot, a Docker restart or `kind create cluster`:
# lets containerd on each kind node pull from zot.internal.kind.test over HTTPS.
set -euo pipefail
cd "$(dirname "$0")/.."    # wq_practical_book/

REG=zot.internal.kind.test
DIR=/etc/containerd/certs.d/$REG
GW_IP=$(kubectl get gateway -n gateway-infra gateway -o jsonpath='{.status.addresses[0].value}')
[ -n "$GW_IP" ] || { echo "Gateway has no address yet; is cloud-provider-kind running?" >&2; exit 1; }

for node in $(kind get nodes); do
  # Name -> Gateway IP. Add it only if it's missing.
  docker exec "$node" sh -c "grep -q '$REG' /etc/hosts || echo '$GW_IP $REG' >> /etc/hosts"
  # Trust the lab root for this registry only.
  docker exec "$node" mkdir -p "$DIR"
  docker cp Lab/cert-manager/wq-lab-ca.crt "$node:$DIR/ca.crt"
  cat <<EOF | docker exec -i "$node" cp /dev/stdin "$DIR/hosts.toml"
server = "https://$REG"

[host."https://$REG"]
  capabilities = ["pull", "resolve"]
  ca = "$DIR/ca.crt"
EOF
  docker exec "$node" getent hosts "$REG"
done