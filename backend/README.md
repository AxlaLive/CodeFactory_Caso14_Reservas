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

For a Render Web Service using this repository, set the root directory to the
repository root and use:

```sh
# Build command
mvn -f backend/pom.xml clean package -DskipTests

# Start command
java -jar backend/target/reservas-backend-0.0.1-SNAPSHOT.jar
```

The production profile binds Spring Boot to Render's `PORT` environment
variable, defaulting to `8080` for local runs.

Flyway applies pending migrations at startup. Add future schema changes as new
`V<number>__description.sql` files; do not edit a migration that has already
been applied to a shared database.
