# Setup env for OTEL

Assume you have the kind setup and the notification-service can be accessed via cloud-provider-kind
```bash
$ curl http://notification-service.internal.kind.test/actuator/health
{"groups":["liveness","readiness"],"status":"UP"}% 
```

Setup namespace
```bash
kubectl create ns observability
```

Expose OTEL metrics
2 ways
1st way: 
Java Agent, JVM loads `opentelemetry-javaagent.jar` it on startup.
To install it, just need to bake it into the docker image and set environment variables to configure it.

2nd way:
add dependencies such as opentelemetry-api, opentelemetry-sdk and opentelemetry-exporter-otlp to pom.xml
What you gain: full control over what's recorded.

