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
into gateway-infra, next to the Gateway, so the listener can reference its Secret.

## Add an https listener (port 443, tls.mode: Terminate, certificateRefs pointing at that Secret) to kind/gateway.yaml.
## Trust the CA in Docker at /etc/docker/certs.d/zot.internal.kind.test/ca.crt. There's no port in the directory name, because 443 is the default.

docker push zot.internal.kind.test/test/alpine:3.20
