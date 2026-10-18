package com.codefactory.reservas;

import com.codefactory.reservas.Security.JwtService;
import com.codefactory.reservas.domain.Cita;
import com.codefactory.reservas.domain.EspacioFisico;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.domain.Servicio;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.EspacioFisicoRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import com.codefactory.reservas.repository.ServicioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HistoriaClinicaApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProfesionalRepository profesionalRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private EspacioFisicoRepository espacioRepository;

    @Autowired
    private ServicioRepository servicioRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private Paciente paciente;
    private Cita cita;
    private Profesional profesional;
    private Profesional otroProfesional;
    private Profesional recepcionista;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        profesional = guardarTrabajador("prof" + suffix, "PROFESSIONAL", suffix + "1");
        otroProfesional = guardarTrabajador("otro" + suffix, "PROFESSIONAL", suffix + "2");
        recepcionista = guardarTrabajador("recep" + suffix, "RECEPTIONIST", suffix + "3");
        paciente = pacienteRepository.save(
                new Paciente(null, "Paciente Historia", "doc" + suffix, true));
        EspacioFisico espacio = espacioRepository.save(
                new EspacioFisico(null, "Espacio Historia " + suffix, "CONSULTORIO", true));
        Servicio servicio = servicioRepository.save(
                new Servicio(null, "Consulta Historia " + suffix, 30));
        cita = citaRepository.saveAndFlush(new Cita(
                null,
                LocalDate.of(2026, 10, 19),
                LocalTime.of(9, 0),
                LocalTime.of(9, 30),
                profesional,
                espacio,
                paciente,
                servicio,
                "Revisión",
                "PROGRAMADA"));
    }

    @Test
    void assignedProfessionalCanWriteAndInternalRolesCanReadClinicalHistory() throws Exception {
        String path = "/api/v1/pacientes/" + paciente.getId() + "/historia-clinica";
        String request = """
                {
                  "citaId": %d,
                  "evolucion": "Paciente estable.",
                  "diagnostico": "Revisión sin hallazgos.",
                  "tratamiento": "Continuar controles.",
                  "recomendaciones": "Mantener higiene oral."
                }
                """.formatted(cita.getId());

        mockMvc.perform(post(path)
                        .header("Authorization", "Bearer " + token(profesional))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.profesional").value("Ana Pérez"))
                .andExpect(jsonPath("$.diagnostico").value("Revisión sin hallazgos."));

        mockMvc.perform(get(path)
                        .header("Authorization", "Bearer " + token(otroProfesional)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].evolucion").value("Paciente estable."));

        mockMvc.perform(get(path)
                        .header("Authorization", "Bearer " + token(recepcionista)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tratamiento").value("Continuar controles."));

        mockMvc.perform(get(path)
                        .header("Authorization", "Bearer " + jwtService.generateToken("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].recomendaciones").value("Mantener higiene oral."));
    }

    @Test
    void onlyTheProfessionalAssignedToTheAppointmentCanWriteHistory() throws Exception {
        String path = "/api/v1/pacientes/" + paciente.getId() + "/historia-clinica";
        String request = """
                {
                  "citaId": %d,
                  "evolucion": "Evolución.",
                  "diagnostico": "Diagnóstico.",
                  "tratamiento": "Tratamiento.",
                  "recomendaciones": "Recomendaciones."
                }
                """.formatted(cita.getId());

        mockMvc.perform(post(path)
                        .header("Authorization", "Bearer " + token(otroProfesional))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isForbidden());

        mockMvc.perform(post(path)
                        .header("Authorization", "Bearer " + jwtService.generateToken("admin"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isForbidden());
    }

    private Profesional guardarTrabajador(String username, String role, String suffix) {
        return profesionalRepository.save(Profesional.builder()
                .nombre("Ana")
                .apellido("Pérez")
                .documento("90" + suffix)
                .especialidad(role.equals("PROFESSIONAL") ? "Odontólogo general" : null)
                .correo(username + "@example.com")
                .activo(true)
                .rol(role)
                .usuario(username)
                .passwordHash(passwordEncoder.encode("secure123"))
                .build());
    }

    private String token(Profesional trabajador) {
        return jwtService.generateToken(trabajador.getUsuario(), "ROLE_" + trabajador.getRol());
    }
}
