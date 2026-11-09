# Container Deployment

This deployment runs the Spring Boot backend and Vite frontend as containers. PostgreSQL is hosted externally, such as Azure Database for PostgreSQL Flexible Server.

## Azure PostgreSQL setup

Create a PostgreSQL database named `springer` on the Azure server. Configure the server firewall to allow the public IP of the Docker host. Keep SSL enabled and use a JDBC URL with `sslmode=require`.

The backend runs the PostgreSQL Flyway migrations automatically on startup:

- `springer/src/main/resources/db/postgresql/migration/V1__Initial_Schema.sql`
- `springer/src/main/resources/db/postgresql/migration/V2__Seed_Data.sql`
- `springer/src/main/resources/db/postgresql/migration/V3__Seed_Our_Part_Data.sql`

`V2` and `V3` contain seed/demo data. Use this migration set only for a new database unless the existing database has been assessed first.

## Configure environment

Copy `.env.example` to `.env` and replace every placeholder:

```powershell
Copy-Item .env.example .env
```

Required values include:

- `SPRINGER_POSTGRES_URL`
- `SPRINGER_POSTGRES_USER`
- `SPRINGER_POSTGRES_PASSWORD`
- `APP_FRONTEND_URL`
- `APP_CORS_ALLOWED_ORIGINS`
- `JWT_SECRET`
- `APP_JWT_SECRET`
- SMTP settings

Use independent long random values for both JWT secrets. Do not commit `.env`.

## Build and run

From the repository root:

```powershell
docker compose --env-file .env config
docker compose --env-file .env up --build -d
docker compose ps
docker compose logs -f backend
```

The default published ports are:

- Frontend: `http://localhost:80`
- Backend: `http://localhost:8080`

Browser traffic should use the frontend URL. Nginx forwards `/api` and `/ws` to the backend container. The backend port is published for diagnostics and direct port forwarding.

Stop the deployment with:

```powershell
docker compose --env-file .env down
```

## Azure proxy behavior

Put the Azure TLS/reverse proxy in front of the frontend container. Nginx forwards `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto` to Spring Boot. Spring Boot is configured with `server.forward-headers-strategy=framework`, so generated links can use the public HTTPS host.

The frontend build embeds `VITE_API_URL=/api`. The notification WebSocket uses the browser origin and automatically selects `wss://` when the public page uses HTTPS.

## Health checks

After startup, verify:

1. The frontend loads at the public URL.
2. Refreshing a nested frontend route still returns the application.
3. Login succeeds and authenticated `/api` requests work.
4. Browser developer tools show WebSocket traffic to `/ws/notifications` on the public origin.
5. Backend logs show successful Flyway migration and PostgreSQL connection.