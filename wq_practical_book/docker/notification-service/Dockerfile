# Build the jar first, then run this from wq_practical_book/:
#   docker build -f docker/notification-service/Dockerfile -t notification-service:1.0.0 .
FROM gcr.io/distroless/java25-debian13:nonroot
# The app version without -SNAPSHOT. CI passes it with --build-arg APP_VERSION=<version>.
ARG APP_VERSION=1.0.1
COPY apps/notification-service/target/notification-service-${APP_VERSION}.jar /app/app.jar
EXPOSE 8080
# The base image's entrypoint is already "java -jar".

# Lab 5: Install Otel Agent opentelemetry-javaagent.jar into docker image
# Source: https://opentelemetry.io/docs/zero-code/java/agent/getting-started/
ARG OTEL_AGENT_VERSION=2.33.1
ADD --chmod=644 https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_AGENT_VERSION}/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar

ENV JAVA_TOOL_OPTIONS="-javaagent:/app/opentelemetry-javaagent.jar"
ENV OTEL_SERVICE_NAME="notification-service"
CMD ["/app/app.jar"]
