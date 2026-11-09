# Build the jar first, then run this from wq_practical_book/:
#   docker build -f docker/notification-service/Dockerfile -t notification-service:1.0.0 .
FROM gcr.io/distroless/java25-debian13:nonroot
# The app version without -SNAPSHOT. CI passes it with --build-arg APP_VERSION=<version>.
ARG APP_VERSION=1.0.0
COPY apps/notification-service/target/notification-service-${APP_VERSION}.jar /app/app.jar
EXPOSE 8080
# The base image's entrypoint is already "java -jar".
CMD ["/app/app.jar"]
