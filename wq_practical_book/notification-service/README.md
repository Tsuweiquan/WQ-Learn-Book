# notification-service

A small Spring Boot app that counts notifications. "Sending" a notification only adds 1 to an in-memory counter, so the count goes back to 0 when the app restarts.

## API

| Method | Path | What it does | Response |
| --- | --- | --- | --- |
| `POST` | `/notifications` | Sends a notification (counter += 1) | `{"sent":<new total>}` |
| `GET` | `/notifications/count` | Shows how many notifications have been sent | `{"sent":<total>}` |

The app also exposes these Actuator endpoints:

| Path | What it shows |
| --- | --- |
| `/actuator/health` | Whether the app is up |
| `/actuator/metrics/notifications.sent` | The notification counter, as JSON |
| `/actuator/prometheus` | All metrics, in Prometheus format |

## Logging and metrics

- **Logging:** the code logs through the SLF4J API. Logback, Spring Boot's default backend, writes the logs to stdout.
- **Metrics:** the code records a Micrometer counter named `notifications.sent`. Prometheus format shows it as `notifications_sent_total`. The app doesn't push metrics anywhere; a Prometheus server would scrape `/actuator/prometheus`.

## Prerequisites

You need JDK 25 or newer. You don't need to install Maven, because `./mvnw` downloads the right version.

```bash
sudo apt install openjdk-25-jdk-headless
java -version
```

If you'd rather not install a JDK, see [Build and run with Docker](#build-and-run-with-docker).

## Build

```bash
./mvnw clean package
```

This compiles the code, runs the tests and creates `target/notification-service-1.0.0.jar`. The first build takes about a minute because it downloads Maven and the dependencies.

## Run

```bash
java -jar target/notification-service-1.0.0.jar
```

The app is ready on port 8080 when you see a line like this:

```text
Started NotificationServiceApplication in 1.359 seconds (process running for 1.622)
```

Press `Ctrl+C` to stop it.

## Test

### Automated test

```bash
./mvnw test
```

The test starts the app in memory, calls both APIs and checks the Micrometer counter. A passing run ends with:

```text
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### Manual test

Start the app, then run these commands in a second terminal. The expected output is shown under each command.

Check the starting count:

```bash
curl http://localhost:8080/notifications/count
```

```text
{"sent":0}
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

Check the count again:

```bash
curl http://localhost:8080/notifications/count
```

```text
{"sent":3}
```

Check the metric in Micrometer's JSON format:

```bash
curl http://localhost:8080/actuator/metrics/notifications.sent
```

```text
{"availableTags":[],"description":"Number of notifications sent","measurements":[{"statistic":"COUNT","value":3.0}],"name":"notifications.sent"}
```

Check the same metric in Prometheus format:

```bash
curl -s http://localhost:8080/actuator/prometheus | grep notifications_sent
```

```text
# HELP notifications_sent_total Number of notifications sent
# TYPE notifications_sent_total counter
notifications_sent_total 3.0
```

The terminal running the app shows one log line per notification:

```text
2026-11-02T14:34:18.886Z  INFO 1 --- [notification-service] [nio-8080-exec-6] c.e.notification.NotificationService     : Notification sent, total sent=1
2026-11-02T14:34:18.895Z  INFO 1 --- [notification-service] [nio-8080-exec-8] c.e.notification.NotificationService     : Notification sent, total sent=2
2026-11-02T14:34:18.904Z  INFO 1 --- [notification-service] [io-8080-exec-10] c.e.notification.NotificationService     : Notification sent, total sent=3
```

## Build and run with Docker

If you have Docker, you can build and run the app without installing a JDK.

Build the jar. This also runs the tests:

```bash
# Create the cache first. Otherwise Docker creates it owned by root and the build can't write to it.
mkdir -p ~/.m2

docker run --rm -u "$(id -u):$(id -g)" \
  -v "$PWD":/app -w /app \
  -v "$HOME/.m2":/var/maven/.m2 -e MAVEN_CONFIG=/var/maven/.m2 \
  maven:3.9-eclipse-temurin-25 \
  mvn -Duser.home=/var/maven clean package
```

Run the jar:

```bash
docker run --rm -p 8080:8080 \
  -v "$PWD/target":/app -w /app \
  maven:3.9-eclipse-temurin-25 \
  java -jar notification-service-1.0.0.jar
```

Press `Ctrl+C` to stop it. The [manual test](#manual-test) works the same way.
