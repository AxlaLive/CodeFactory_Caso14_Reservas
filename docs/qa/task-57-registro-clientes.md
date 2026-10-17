# Task 57-QA — HU-1.3 Registro de nuevo cliente

## Alcance y criterios

Validar el registro público, la persistencia de datos, la autenticación posterior
y las respuestas ante campos inválidos. El escenario fallido de la HU está
incompleto; para estas pruebas se toma el contrato de la task 55: HTTP 400,
mensaje de validación y ningún dato guardado. Los duplicados responden HTTP 409.
Los campos y límites se toman de `RegistroClienteRequest`; requieren acuerdo
del equipo si se desean reglas distintas.

Entorno automatizado: Spring Boot, MockMvc, H2 y migraciones Flyway V1–V3.
Las pruebas usan datos únicos y una base de pruebas, sin depender del servidor
local ni modificar la base de producción. Son pruebas de API, no de navegador.

## Matriz de casos automatizados

| ID | Caso | Resultado esperado | Prueba |
| --- | --- | --- | --- |
| QA57-01 | Registro válido sin autenticación previa | 201, JWT, correo y ROLE_CLIENTE; hash BCrypt verificable | RegistroClienteApiTest |
| QA57-02 | Usar JWT del registro para consultar servicios | 200 sin volver a iniciar sesión | RegistroClienteApiTest |
| QA57-03 | Cliente consulta pacientes | 403 | RegistroClienteApiTest |
| QA57-04 | Login posterior con correo y contraseña | 200 y ROLE_CLIENTE | RegistroClienteApiTest |
| QA57-05 | Repetir registro completo | 409 | RegistroClienteApiTest |
| QA57-06 | Cuerpo vacío o varios campos inválidos | 400 y VALIDATION_ERROR; sin cuenta nueva | RegistroClienteApiTest |
| QA57-07 | Cada campo ausente, nulo, vacío o solo espacios (20 variantes) | 400, mensaje, sin JWT ni nuevas filas de cliente o paciente | RegistroClienteValidacionesTest |
| QA57-08 | Correo sin arroba o demasiado largo | 400 sin guardar | RegistroClienteValidacionesTest |
| QA57-09 | Nombre y documento de 256 caracteres | 400 sin guardar | RegistroClienteValidacionesTest |
| QA57-10 | Teléfono con letras, menor de 7 o mayor de 30 caracteres | 400 sin guardar | RegistroClienteValidacionesTest |
| QA57-11 | Contraseña de 7, 73 caracteres o más de 72 bytes UTF-8 | 400 sin guardar | RegistroClienteValidacionesTest |
| QA57-12 | Contraseña de 8 o 72 caracteres ASCII y de 72 bytes UTF-8 | 201 en las tres variantes | RegistroClienteValidacionesTest |
| QA57-13 | Nombre/documento con espacios y correo en mayúsculas | Datos normalizados | RegistroClienteValidacionesTest |
| QA57-14 | Solo correo duplicado, variando mayúsculas | 409 sin paciente ni cuenta adicionales | RegistroClienteValidacionesTest |
| QA57-15 | Solo documento duplicado | 409 sin paciente ni cuenta adicionales | RegistroClienteValidacionesTest |
| QA57-16 | Documento de paciente existente sin cuenta | 409; paciente original sin cambios | RegistroClienteValidacionesTest |

## Reproducción

Con JDK 21 y Maven, desde `backend`:

```sh
mvn test
```

Solo registro:

```sh
mvn "-Dtest=RegistroClienteApiTest,RegistroClienteValidacionesTest" test
```

En Java 23 el entorno local necesita `-Dmaven.compiler.proc=full` para Lombok.

Para una comprobación manual en Postman, iniciar el backend y enviar
`POST http://localhost:8080/api/auth/register`, con `Content-Type: application/json`:

```json
{
  "nombre": "Cliente QA",
  "documento": "QA57-001",
  "correo": "qa57-001@example.com",
  "telefono": "3001234567",
  "password": "ClaveQA123"
}
```

Verificar 201 y usar el `token` como Bearer en `GET /api/servicios` (200).
Repetir el registro (409). Usar otro documento/correo e ingresar una contraseña
de 7 caracteres (400). Usar datos únicos en cada nueva ejecución manual.
Esta guía manual no constituye evidencia de ejecución en navegador/Postman.

## Hallazgos y dependencias del frontend

### QA57-F01 — No existe formulario de registro público (bloquea el flujo completo)

Evidencia por inspección: `src/pages/LoginPage.jsx` solo ofrece login y muestra
que el registro se habilitará en otra etapa. `authService` en
`src/api/clinicService.js` no expone una operación de registro.

Esperado: el cliente puede completar el formulario, recibir validaciones y,
al registrarse correctamente, entrar autenticado al portal.
Actual: no hay un punto de entrada para realizar ese flujo desde la interfaz.

### QA57-F02 — ROLE_CLIENTE cae en el panel administrativo (prioridad alta)

Pasos deducidos del código: crear un cliente por API e iniciar sesión con él
en el formulario web. `authService.login` conserva ROLE_CLIENTE, pero
`src/App.jsx` solo distingue `professional`; las demás sesiones reciben
`AdminPage`. No hay una ruta al portal de clientes en ese componente.

Esperado: la sesión de cliente se dirige al portal de clientes.
Resultado deducido por inspección: se selecciona el panel administrativo,
cuyas solicitudes protegidas son rechazadas por el backend. No se reporta
como una reproducción ejecutada en navegador ni como acceso a datos de admin.

## Resultado de ejecución — 16 de octubre de 2026

Suite ejecutada con Java 23, procesamiento de anotaciones habilitado y las
dependencias Maven locales (`mvn -o -Dmaven.compiler.proc=full test`, con el
repositorio local de dependencias ubicado en `backend/target/m2`).
Resultado: **44 pruebas, 0 fallos, 0 errores, 0 omitidas**:

- CitaServiceTest: 6.
- DisponibilidadApiTest: 2.
- RegistroClienteApiTest: 2.
- RegistroClienteValidacionesTest: 34 nuevas.

Los casos de API de la matriz quedaron aprobados. Las migraciones V1–V3 se
aplicaron correctamente en H2. No se ejecutaron pruebas contra PostgreSQL,
ni se verificó la interfaz en un navegador. Los hallazgos de frontend siguen abiertos.

## Estado de cierre

La validación de API puede aprobarse con la suite en verde. La task 57 completa
queda pendiente de implementar el formulario y el enrutamiento de clientes,
y de ejecutar en navegador el siguiente recorrido:

1. Abrir registro y enviar campos vacíos o inválidos: ver mensajes y permanecer en el formulario.
2. Corregir los datos: crear una sola cuenta y entrar automáticamente al portal de clientes.
3. Consultar servicios con la sesión creada y comprobar el rol de cliente.
4. Cerrar sesión y volver a ingresar con correo y contraseña.
5. Intentar registrar el mismo correo/documento y comprobar el mensaje de duplicado.

No marcar la redirección como aprobada únicamente porque la API devuelve un JWT.
