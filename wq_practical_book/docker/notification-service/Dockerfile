# Build the jar first, then run this from wq_practical_book/:
#   docker build -f docker/notification-service/Dockerfile -t notification-service:1.0.0 .
FROM gcr.io/distroless/java25-debian13:nonroot
COPY notification-service/target/notification-service-1.0.0.jar /app/app.jar
EXPOSE 8080
# The base image's entrypoint is already "java -jar".
CMD ["/app/app.jar"]
