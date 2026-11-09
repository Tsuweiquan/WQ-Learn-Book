# notification-service Docker image

[`docker/notification-service/Dockerfile`](docker/notification-service/Dockerfile) builds the image for the [notification-service](notification-service/README.md) app. The image copies in a jar you've already built and runs it on Java 25.

The image uses the distroless base `gcr.io/distroless/java25-debian13:nonroot`, so:

- It runs as a non-root user (UID 65532).
- It has no shell or package manager.
- Its entrypoint is already `java -jar`, so the `Dockerfile` only passes the jar path in `CMD`.

## Build the image

The `Dockerfile` doesn't compile anything, so build the jar first. Do this again whenever the code changes, or the image will contain the old jar.

From `wq_practical_book/notification-service/`:

```bash
./mvnw clean package
```

If you don't have JDK 25, use the [Docker build command](notification-service/README.md#build-and-run-with-docker) in the app's README instead.

Then build the image from `wq_practical_book/`, because the build needs to see both this folder and the jar:

```bash
cd /home/user/wq_learn_book/wq_practical_book

docker build -f docker/notification-service/Dockerfile -t notification-service:1.0.0 .
```

Docker load into Kind
```bash
kind load docker-image notification-service:1.0.0
# Verify if image is loaded into KinD
docker exec -it kind-control-plane crictl images | grep notification-service
```

The build ends with:

```text
Successfully tagged notification-service:1.0.0
```

## Run the image

```bash
docker run --rm -p 8080:8080 notification-service:1.0.0
```

If port 8080 is already in use, change the host port, for example `-p 18080:8080`, and use that port in the test commands below.

Press `Ctrl+C` to stop it.

## Test the image

With the container running, run these commands in a second terminal. The expected output is shown under each command.

Check that the app is up:

```bash
curl http://localhost:8080/actuator/health
```

```text
{"groups":["liveness","readiness"],"status":"UP"}
```

Send three notifications:

```bash
for i in 1 2 3; do curl -X POST http://localhost:8080/notifications; echo; done
```

```text
{"sent":1}
{"sent":2}
{"sent":3}
```

Check the count:

```bash
curl http://localhost:8080/notifications/count
```

```text
{"sent":3}
```

Check the metric:

```bash
curl -s http://localhost:8080/actuator/prometheus | grep '^notifications_sent'
```

```text
notifications_sent_total 3.0
```

The counter is in memory, so a new container starts again from 0.

## Working without a shell

Because the image has no shell, this command fails:

```bash
docker exec <container> sh
```

```text
OCI runtime exec failed: exec failed: unable to start container process: exec: "sh": executable file not found in $PATH
```

Use these instead:

- **Logs:** run `docker logs <container>`.
- **Health checks:** on Kubernetes, use an `httpGet` probe on `/actuator/health`. Probes that rely on a shell or `curl` inside the container won't work.
