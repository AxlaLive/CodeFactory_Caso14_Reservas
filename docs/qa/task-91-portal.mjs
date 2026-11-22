import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'

// Servidor local de QA. Los datos son ficticios y las citas solo viven en memoria.
const paciente = {
  id: 1, nombre: 'Paciente QA', documento: 'QA-91',
  correo: 'task91@example.invalid', telefono: '3000000000',
}
const profesional = {
  id: 1, nombre: 'Ana', apellido: 'Prueba', especialidad: 'Odontólogo general', activo: true,
}
const espacioFisico = { id: 1, nombre: 'Consultorio QA', tipo: 'CONSULTORIO', activo: true }
const servicio = { id: 1, nombre: 'Consulta de odontología general', duracionMinutos: 30 }
const session = {
  id: '1', role: 'client', token: 'task-91-local', name: paciente.nombre,
  email: paciente.correo, identification: paciente.documento, phone: paciente.telefono,
}
const citas = []
const catalogos = new Map([
  ['/api/pacientes', [paciente]],
  ['/api/v1/profesionales', [profesional]],
  ['/api/espacios', [espacioFisico]],
  ['/api/servicios', [servicio]],
  ['/api/disponibilidades', []],
  ['/api/citas/rango', citas],
])

function json(response, code, data) {
  response.writeHead(code, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(data))
}

process.env.VITE_API_BASE_URL = '/api'
const server = await createServer({
  cacheDir: await mkdtemp(join(tmpdir(), 'dentia-task91-vite-')),
  server: { host: '127.0.0.1', port: 43192, strictPort: true },
  plugins: [{
    name: 'task-91-portal',
    configureServer(vite) {
      vite.middlewares.use(async (request, response, next) => {
        const { pathname } = new URL(request.url, 'http://127.0.0.1')
        if (pathname === '/qa') {
          response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          response.end(`<script>
            localStorage.setItem('dentia-auth', ${JSON.stringify(JSON.stringify(session))})
            location.replace('/')
          </script>`)
          return
        }
        if (request.method === 'GET' && catalogos.has(pathname)) {
          json(response, 200, catalogos.get(pathname))
          return
        }
        if (request.method !== 'POST' || pathname !== '/api/citas') {
          next()
          return
        }

        let body = ''
        for await (const chunk of request) body += chunk
        const { fecha, horaInicio, motivo } = JSON.parse(body)
        if (horaInicio === '09:00') {
          json(response, 409, { message: 'El profesional no está disponible en ese horario.' })
          return
        }
        const horaFin = new Date(Date.parse(`1970-01-01T${horaInicio}:00Z`) + 30 * 60_000)
          .toISOString().slice(11, 16)
        const cita = {
          id: citas.length + 1, fecha, horaInicio, horaFin, motivo, estado: 'PROGRAMADA',
          paciente, profesional, espacioFisico, servicio,
        }
        citas.push(cita)
        json(response, 201, cita)
      })
    },
  }],
})
await server.listen()
console.log('Portal de QA: http://127.0.0.1:43192/qa')
