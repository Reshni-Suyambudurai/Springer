FROM eclipse-temurin:21-jdk AS build

WORKDIR /workspace
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src src

RUN chmod +x mvnw && ./mvnw -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app
RUN groupadd --system springer && useradd --system --gid springer springer
COPY --from=build /workspace/target/*.jar /app/springer.jar
RUN chown -R springer:springer /app

USER springer
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/springer.jar"]