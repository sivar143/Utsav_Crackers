# Build the Spring Boot application with a pinned Java major version.
FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src

# Maven Central can temporarily return 5xx responses. Retry the complete
# dependency resolution/package step so transient repository outages do not
# fail an otherwise healthy local Docker build.
RUN for attempt in 1 2 3 4 5; do \
      mvn --batch-mode --no-transfer-progress -DskipTests package && exit 0; \
      status=$?; \
      if [ "$attempt" -eq 5 ]; then exit "$status"; fi; \
      echo "Maven build failed (attempt $attempt/5); retrying in $((attempt * 10)) seconds..."; \
      sleep $((attempt * 10)); \
    done

FROM eclipse-temurin:21-jre-jammy
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --home-dir /app appuser
WORKDIR /app
COPY --from=build --chown=appuser:appuser /workspace/target/utsav-crackers-api-0.1.0-SNAPSHOT.jar /app/app.jar
USER 10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 CMD curl --fail --silent http://127.0.0.1:8080/actuator/health/readiness || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
