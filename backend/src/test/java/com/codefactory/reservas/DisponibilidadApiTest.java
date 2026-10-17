package com.codefactory.reservas;

import com.codefactory.reservas.Security.JwtService;
import com.codefactory.reservas.domain.EspacioFisico;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.domain.Servicio;
import com.codefactory.reservas.repository.EspacioFisicoRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import com.codefactory.reservas.repository.ServicioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DisponibilidadApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProfesionalRepository profesionalRepository;

    @Autowired
    private EspacioFisicoRepository espacioRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private ServicioRepository servicioRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private Profesional profesional;
    private String token;

    @BeforeEach
    void setUp() {
        profesional = profesionalRepository.save(Profesional.builder()
                .nombre("Ana")
                .apellido("Pérez")
                .documento("2000000" + UUID.randomUUID().toString().replace("-", "").substring(0, 8))
                .especialidad("Odontología")
                .correo("ana.perez@example.com")
                .activo(true)
                .build());
        token = jwtService.generateToken("admin");
    }

    @Test
    void shouldCreateQueryUpdateAndDeleteAvailabilityImmediately() throws Exception {
        String request = """
                {
                  "profesionalId": %d,
                  "fecha": "2026-10-12",
                  "horaInicio": "08:00:00",
                  "horaFin": "12:00:00",
                  "tipo": "AVAILABLE",
                  "motivo": "Atención"
                }
                """.formatted(profesional.getId());

        String response = mockMvc.perform(post("/api/disponibilidades")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("AVAILABLE"))
                .andReturn().getResponse().getContentAsString();

        long id = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/disponibilidades")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id));

        mockMvc.perform(get("/api/disponibilidades")
                        .header("Authorization", "Bearer " + token)
                        .param("profesionalId", profesional.getId().toString())
                        .param("inicio", "2026-10-12")
                        .param("fin", "2026-10-18"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].horaInicio").value("08:00:00"));

        mockMvc.perform(put("/api/disponibilidades/{id}", id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request.replace("08:00:00", "09:00:00")
                                .replace("12:00:00", "13:00:00")
                                .replace("AVAILABLE", "BREAK")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("BREAK"))
                .andExpect(jsonPath("$.horaInicio").value("09:00:00"));

        mockMvc.perform(get("/api/disponibilidades/{id}", id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("BREAK"));

        mockMvc.perform(delete("/api/disponibilidades/{id}", id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/disponibilidades")
                        .header("Authorization", "Bearer " + token)
                        .param("profesionalId", profesional.getId().toString())
                        .param("inicio", "2026-10-12")
                        .param("fin", "2026-10-18"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void shouldPersistResourcesRequiredToBookAppointments() throws Exception {
        mockMvc.perform(post("/api/pacientes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Paciente de prueba",
                                  "documento": "30000001",
                                  "telefono": "3001234567",
                                  "correo": "paciente@example.com",
                                  "activo": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.telefono").value("3001234567"))
                .andExpect(jsonPath("$.correo").value("paciente@example.com"));

        mockMvc.perform(post("/api/espacios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Consultorio API",
                                  "tipo": "CONSULTORIO",
                                  "activo": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Consultorio API"));

        mockMvc.perform(post("/api/servicios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Consulta API",
                                  "duracionMinutos": 30
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.duracionMinutos").value(30));
    }

    @Test
    void shouldReturnAppointmentDetailsWithoutSerializingJpaProxies() throws Exception {
        EspacioFisico espacio = espacioRepository.save(new EspacioFisico(
                null, "Consultorio cita", "CONSULTORIO", true));
        Paciente paciente = new Paciente(
                null,
                "Paciente cita",
                "3000000" + UUID.randomUUID().toString().replace("-", "").substring(0, 8),
                true);
        paciente.setTelefono("3001234567");
        paciente.setCorreo("cita@example.com");
        paciente = pacienteRepository.save(paciente);
        Servicio servicio = servicioRepository.save(new Servicio(null, "Consulta cita", 30));

        mockMvc.perform(post("/api/citas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fecha": "2026-10-13",
                                  "horaInicio": "09:00:00",
                                  "profesionalId": %d,
                                  "espacioId": %d,
                                  "pacienteId": %d,
                                  "servicioId": %d,
                                  "motivo": "Consulta de prueba"
                                }
                                """.formatted(profesional.getId(), espacio.getId(),
                                paciente.getId(), servicio.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paciente.documento").value(paciente.getDocumento()));

        mockMvc.perform(get("/api/citas/rango")
                        .header("Authorization", "Bearer " + token)
                        .param("inicio", "2026-10-12")
                        .param("fin", "2026-10-18"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].profesional.nombre").value("Ana"))
                .andExpect(jsonPath("$[0].espacioFisico.nombre").value("Consultorio cita"))
                .andExpect(jsonPath("$[0].paciente.telefono").value("3001234567"))
                .andExpect(jsonPath("$[0].servicio.duracionMinutos").value(30));
    }
}
