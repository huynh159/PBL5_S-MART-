# Stage 1: Build the application
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn
RUN chmod +x ./mvnw || true

# Download dependencies
RUN ./mvnw dependency:go-offline -B || sh ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw package -DskipTests || sh ./mvnw package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]

