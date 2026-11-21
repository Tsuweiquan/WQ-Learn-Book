# Free certificate for internal lab via Cert Manager

## Install cert-manager.
```bash
helm repo add jetstack https://charts.jetstack.io
helm search repo jetstack/cert-manager 
helm upgrade --install cert-manager jetstack/cert-manager --version v1.21.3 -n cert-manager --create-namespace --set crds.enabled=true --wait
```

## Create a CA with cert-manager
- Create a CA cert via yaml

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-bootstrap
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: lab-ca
  namespace: cert-manager
spec:
  isCA: true
  commonName: WQ Lab CA
  secretName: lab-ca-tls
  duration: 87600h        # 10 years
  privateKey:
    algorithm: ECDSA
    size: 256
  issuerRef:
    name: selfsigned-bootstrap
    kind: ClusterIssuer
    group: cert-manager.io
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: lab-ca-issuer
spec:
  ca:
    secretName: lab-ca-tls

```

kubectl apply -f Lab/cert-manager/ca-certificate-creation.yaml


## Issue a *.internal.kind.test Certificate

Issue a certificate
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: wildcard-internal-kind-test
  namespace: gateway-infra
spec:
  secretName: wildcard-internal-kind-test-tls
  dnsNames:
    - "*.internal.kind.test"
  privateKey:
    algorithm: ECDSA
    size: 256
  issuerRef:
    name: lab-ca-issuer
    kind: ClusterIssuer
    group: cert-manager.io
```

## Update the Gateway with the tls certificate
Update Gateway
```yaml
  - name: https
    hostname: "*.internal.kind.test"
    port: 443
    protocol: HTTPS
    tls:
      mode: Terminate
      certificateRefs:
      - kind: Secret
        name: wildcard-internal-kind-test-tls
    allowedRoutes:
      namespaces:
        from: All
```
```bash
kubectl apply -f kind/gateway.yaml
```

# Trust the CA cert in my computer
```bash
kubectl get secret -n cert-manager lab-ca-tls -o jsonpath='{.data.tls\.crt}' \
  | base64 -d > Lab/cert-manager/wq-lab-ca.crt
curl -i --cacert Lab/cert-manager/wq-lab-ca.crt https://zot.internal.kind.test/v2/

sudo cp Lab/cert-manager/wq-lab-ca.crt /usr/local/share/ca-certificates/wq-lab-ca.crt
sudo update-ca-certificates        # should report "1 added"
sudo snap restart docker

# Add the CA cert into Chromium or your browser
```

# Update all the other httproute to use https
Example:
zot, prometheus, grafana
```yaml
# Before
  parentRefs:
    - name: gateway
      namespace: gateway-infra
      sectionName: default
# After
  parentRefs:
    - name: gateway
      namespace: gateway-infra
      sectionName: https
```

