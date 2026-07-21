# Build Stage
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy pom.xml and resolve dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build final jar
COPY src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy compiled jar from build stage
COPY --from=builder /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Run Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
