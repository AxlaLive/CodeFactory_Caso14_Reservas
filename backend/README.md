# Reservas backend

## HU-1.3 / Task 55: registro de clientes

`POST /api/auth/register` es público y recibe JSON:

```json
{
  "nombre": "Ana Pérez",
  "documento": "1020304050",
  "correo": "ana@example.com",
  "telefono": "3001234567",
  "password": "MiClave123"
}
```

Todos los campos son obligatorios. La contraseña requiere 8 a 72 caracteres
y un máximo de 72 bytes UTF-8 por BCrypt. El correo debe tener formato válido.
El correo se guarda en minúsculas y no se permiten cuentas con correo o
documento repetidos. Un documento de paciente existente requiere atención del
consultorio; el registro público no vincula cuentas a pacientes existentes.

Respuestas: `201` con `token`, `username` (correo) y `role: ROLE_CLIENTE`;
`400` con `VALIDATION_ERROR` para campos inválidos; `409` con `CONFLICT`
para duplicados. El paciente y su cuenta se guardan en una sola transacción.
La contraseña se guarda como hash BCrypt y nunca se devuelve en la respuesta.

El frontend debe guardar el token y redirigir al portal tras recibir `201`.
Puede consultar `GET /api/servicios` usando `Authorization: Bearer <token>`.
Las demás operaciones requieren rol ADMIN. Para volver a iniciar sesión,
usar `POST /api/auth/login` con `username` igual al correo y `password`.
La migración V3 agrega `clientes` sin modificar las migraciones existentes.
Las pruebas automatizadas de API están en `RegistroClienteApiTest`;
la validación del formulario y de la redirección corresponde a la task 57.

## Local development

The default profile uses an in-memory H2 database. Flyway creates its schema
from the versioned scripts in `src/main/resources/db/migration`, and Hibernate
validates that the entities match that schema.

The public `GET /` endpoint returns the backend health status as JSON. It is
intended for deployment checks; the frontend is a separately deployed service.

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

## Demo patients and clinical summaries

The application can create 70 clearly marked synthetic patients, patient
accounts, appointments, and one to three fictional dental notes per patient.
Seeding is disabled by default. To enable it locally or on the Render backend,
set `DEMO_DATA_ENABLED=true` and set `DEMO_DATA_CLIENT_PASSWORD` to a private
password of 8 to 72 UTF-8 bytes. Do not use a real patient's information.

The demo accounts use `paciente.demo.NNNN@example.invalid` as the login email
and `DEMO-DENTIA-NNNN` as the fictitious document, where `NNNN` ranges from
`0001` to `0070`. All demo patients use the password configured in
`DEMO_DATA_CLIENT_PASSWORD`. If the database has no active professional account
with login credentials, the initializer also creates `odontologo-demo` with
that same password so the synthetic appointment histories can be opened by a professional account. The
initializer is idempotent and can be disabled again by setting
`DEMO_DATA_ENABLED=false`; it does not delete records already created.
On Render, add `DEMO_DATA_ENABLED=true` and `DEMO_DATA_CLIENT_PASSWORD` to the
backend Web Service environment and redeploy. The patient account login is the
demo email above; use the password stored in that Render environment variable.
The development-only default administrator is not created when the `prod`
profile is active. Provision production staff accounts with unique credentials.
If an older deployment already created `admin@dentia.com`, rotate or deactivate
that existing account in the production database; disabling the initializer does
not remove an account that was already persisted.

Clinical summaries are generated on demand from saved backend clinical notes.
Groq is the default provider. Configure `GROQ_API_KEY` as a private environment
variable on the backend; `GROQ_MODEL` is optional and defaults to
`openai/gpt-oss-120b`. To use Azure OpenAI instead, set `AI_PROVIDER=azure`
and configure `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and
`AZURE_OPENAI_DEPLOYMENT`; `AZURE_OPENAI_API_VERSION` is optional and defaults
to `2024-10-21`. The Azure endpoint accepts only an HTTPS URL. The backend excludes
account fields and masks known patient identifiers, contact details, and
common identifier patterns before the request. The generated summary is not
stored. Do not enable transmission of real clinical data until the clinic has
reviewed the provider, its terms, data retention and processing location, and
applicable privacy requirements. Use only synthetic records for the demo.
If the selected provider settings are missing, the endpoint responds with `503`
rather than returning a fabricated summary.

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
