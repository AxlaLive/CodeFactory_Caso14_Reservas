# TASK 91 · Concurrencia y pantalla de agendamiento

## Concurrencia en la API

Desde `backend`, ejecutar `mvn -Dtest=AgendamientoConcurrenteApiTest test`.

La prueba deja abierta la transacción de la primera reserva de 09:00 a 09:30 y envía una segunda solicitud en otro hilo. Repite el caso con inicio idéntico (09:00) y con cruce parcial (09:15). Las dos solicitudes usan el mismo profesional y distintos pacientes y consultorios para aislar la validación de la agenda profesional.

En ambos casos, la primera solicitud obtiene HTTP 201 y la segunda espera la confirmación de la primera. Luego recibe HTTP 409 con el mensaje de conflicto. En la base queda una sola cita para ese profesional en la fecha del ensayo.

## Pantalla del paciente

1. Desde la raíz, ejecutar `node docs/qa/task-91-portal.mjs` y abrir [el portal local de pruebas](http://127.0.0.1:43192/qa).
2. Pulsar **Reservar mi primera cita**, elegir una fecha futura y confirmar a las **09:00**. El servidor de pruebas responde HTTP 409. Debe verse la alerta dentro del diálogo, el formulario debe quedar abierto y la agenda debe seguir vacía.
3. Seleccionar **09:30** en el mismo diálogo. La alerta debe desaparecer. Pulsar **Confirmar cita**. El servidor de pruebas responde HTTP 201. El diálogo debe cerrarse, debe aparecer **Tu cita quedó reservada** y en **Próximas citas** debe figurar una sola cita confirmada de **09:30 a 10:00**.

El servidor de pruebas usa datos ficticios y respuestas simuladas. Reiniciarlo vacía la agenda. La prueba de concurrencia usa la API real con H2 y credenciales de administrador, dado que la API actual solo permite confirmar citas a administración y recepción. La reserva con una cuenta real del paciente y la autorización de acudientes quedan pendientes en la HU.
