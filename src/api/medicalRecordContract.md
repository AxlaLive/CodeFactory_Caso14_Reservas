# Contrato del expediente clínico (provisional)

El frontend usa `medicalRecordService` como adaptador de almacenamiento local mientras no exista el backend. La autorización local es solo una protección de interfaz y no sustituye la autorización obligatoria del servidor.

## Acceso y lectura

- `GET /api/medical-records/{patientId}?appointmentId={appointmentId}&since={ISO-8601}&limit=50&cursor={cursor}`
- Requiere `Authorization: Bearer <JWT>`.
- El servidor obtiene el profesional del token y verifica que sea el profesional asignado a `appointmentId`, y que la cita corresponda a `patientId`. Nunca debe confiar en un `professionalId` enviado por el cliente.
- Responde con perfil básico, alergias/alertas y cursores independientes por sección para odontograma, tratamientos, notas e imágenes. La lectura inicial solicita `since` igual a un año antes. Cada lista se ordena por `date` descendente.
- La ausencia de registros es válida y se representa con una lista vacía. La respuesta puede incluir errores por sección para permitir éxito parcial; una sección fallida no invalida las demás.
- `401` indica token expirado o inválido y obliga al cliente a cerrar sesión y descartar el estado clínico en memoria. `403` indica que el profesional no tiene asignada la cita. `404` indica que no existe el expediente/cita.

## Edición

- `POST /api/medical-records/{patientId}/odontogram`
- `POST /api/medical-records/{patientId}/treatments`
- `POST /api/medical-records/{patientId}/notes`
- `POST /api/medical-records/{patientId}/images` (multipart; JPEG, PNG, WEBP o GIF)
- `PUT /api/medical-records/{patientId}/{section}/{recordId}` para editar un registro.
- `DELETE /api/medical-records/{patientId}/{section}/{recordId}` para eliminar un registro.
- Todas las operaciones exigen el mismo JWT y comprobación de asignación activa a la cita. El servidor valida campos, MIME real/tamaño de imágenes y autoría; no se permite modificar el identificador del paciente o el profesional autor.
- Un registro incluye `id`, `date` y los campos propios de la sección. Los estados de pieza dental son `caries`, `restoration`, `absent`, `crown`, `crownNeeded`, `endodontics`, `endodonticsNeeded`, `sealant` e `implant`; las caras dentales son `M`, `D`, `V`, `L` y `O`.

Al habilitar el backend se reemplaza el adaptador local sin cambiar la pantalla. El almacenamiento local demo no debe migrarse ni considerarse fuente clínica de producción.
