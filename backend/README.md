# Reservas backend

## Local development

The default profile uses an in-memory H2 database. Flyway creates its schema
from the versioned scripts in `src/main/resources/db/migration`, and Hibernate
validates that the entities match that schema.

Run the tests with:

```sh
mvn test
```

## Production database

The `prod` profile uses PostgreSQL. Create a PostgreSQL database, then configure
these environment variables on the application service (for example, in
Render's environment settings):

| Variable | Value |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host>:5432/<database>?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | Database user |
| `SPRING_DATASOURCE_PASSWORD` | Database password |
| `JWT_SECRET` | A private, randomly generated secret of at least 32 bytes |
| `JWT_EXPIRATION` | Optional token lifetime in milliseconds |

Use the database's internal connection host when the services are in the same
Render region. If PostgreSQL is hosted outside Render (for example, on Neon),
use the provider's external hostname and require SSL as shown above. Store
secrets in the hosting provider's environment settings; never commit them to
this repository. Do not set `SPRING_JPA_HIBERNATE_DDL_AUTO` to `create` or
`create-drop` in production.

## Deploy the backend to Render

Create a **Web Service** from the GitHub repository and configure its runtime
as **Docker**. Keep the root directory at the repository root and set the
Dockerfile path to `Dockerfile`. Render builds the image and runs the packaged
Spring Boot application. The Docker image runs the `prod` profile and binds to
Render's `PORT` environment variable, defaulting to `8080` outside Render.

Set the production database and JWT environment variables listed above on the
Render Web Service. Do not put database credentials in Docker build arguments,
the Dockerfile, or the image.

For a separately deployed Vite frontend, set `CORS_ALLOWED_ORIGIN_PATTERNS` on
the backend to the exact frontend origin (for example,
`https://your-frontend.onrender.com`). Set `VITE_API_BASE_URL` on the frontend
to the backend URL followed by `/api`; this value is embedded at frontend build
time.

Create the frontend as a **Static Site** in Render, using the repository root,
`npm ci && npm run build` as the build command, and `dist` as the publish
directory. Set `VITE_API_BASE_URL` to the backend's public URL followed by
`/api`, then copy the frontend's public origin into the backend's
`CORS_ALLOWED_ORIGIN_PATTERNS` setting and redeploy the backend.

Flyway applies pending migrations at startup. Add future schema changes as new
`V<number>__description.sql` files; do not edit a migration that has already
been applied to a shared database.
