# Install Notification Service helm file

```bash
helm create notificate-service
```

## Create Namespace
```bash
kubectl create namespace dev
```

## Install App
```bash
helm upgrade --install notification-service helm/notification-service -f helm/notification-service/values.yaml -n dev
```

## Verify installed
```
kubectl get pods -n dev
```

## Curl test
```
kubectl port-forward -n dev svc/notification-service-notificate-service 8080:80
# Application GET Query
curl localhost:8080/notifications/count
# health check
curl localhost:8080/actuator/health
# micrometer
curl localhost:8080/actuator/metrics
```
## Through the Gateway (HTTPRoute)

`values.yaml` turns on an HTTPRoute that attaches to the `gateway` Gateway in `gateway-infra`, on its `default` listener, for host `notification-service.exampledomain.example`. Set up the Gateway first with [Install Gateway API on KinD](../../kind/Installing-Gateway-API.md).

```bash
kubectl get httproute -n dev   # Accepted=True and ResolvedRefs=True under status.parents
GW_ADDR=$(kubectl get gateway -n gateway-infra gateway -o jsonpath='{.status.addresses[0].value}')
H=notification-service.exampledomain.example
curl --resolve $H:80:$GW_ADDR -X POST http://$H/notifications
curl --resolve $H:80:$GW_ADDR http://$H/notifications/count
```

If you get `upstream connect error ... connection timeout`, the Gateway's proxy can't reach the KinD node. Check the host firewall: with ufw's forward policy `DROP`, traffic between containers on the `kind` bridge can be dropped.

## CI

`.github/workflows/helm-lint.yml` runs `helm lint --strict` and `helm template` on every change under `wq_practical_book/helm/`, then validates the output with kubeconform, including the HTTPRoute against the Gateway API schema. It does this for the default values and for `ci/all-features-values.yaml`, which turns on the templates that are off by default.
