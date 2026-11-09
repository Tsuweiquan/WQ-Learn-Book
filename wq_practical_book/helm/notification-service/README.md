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