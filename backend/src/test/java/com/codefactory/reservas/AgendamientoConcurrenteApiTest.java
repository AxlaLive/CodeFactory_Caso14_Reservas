package com.codefactory.reservas;

import com.codefactory.reservas.Security.JwtService;
import com.codefactory.reservas.domain.EspacioFisico;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.domain.Servicio;
import com.codefactory.reservas.dto.CitaRequest;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.EspacioFisicoRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import com.codefactory.reservas.repository.ServicioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
class AgendamientoConcurrenteApiTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private TransactionTemplate transactionTemplate;
    @Autowired
    private CitaRepository citaRepository;
    @Autowired
    private ProfesionalRepository profesionalRepository;
    @Autowired
    private EspacioFisicoRepository espacioRepository;
    @Autowired
    private PacienteRepository pacienteRepository;
    @Autowired
    private ServicioRepository servicioRepository;

    @ParameterizedTest
    @ValueSource(strings = {"09:00", "09:15"})
    void esperaLaPrimeraConfirmacionYRechazaLaReservaCruzada(String segundaHora) throws Exception {
        String referencia = UUID.randomUUID().toString().substring(0, 8);
        var profesional = profesionalRepository.save(Profesional.builder()
                .nombre("Ana").apellido("Pérez").documento("PRO-" + referencia)
                .correo(referencia + "@example.invalid").especialidad("Odontólogo general")
                .activo(true).build());
        var espacio1 = espacioRepository.save(new EspacioFisico(null, "Consultorio 1", "CONSULTORIO", true));
        var espacio2 = espacioRepository.save(new EspacioFisico(null, "Consultorio 2", "CONSULTORIO", true));
        var paciente1 = pacienteRepository.save(new Paciente(null, "Paciente uno", "P1-" + referencia, true));
        var paciente2 = pacienteRepository.save(new Paciente(null, "Paciente dos", "P2-" + referencia, true));
        var servicio = servicioRepository.save(new Servicio(null, "Consulta concurrente", 30));
        var fecha = LocalDate.of(2090, 10, 12);
        var primera = new CitaRequest(fecha, LocalTime.of(9, 0), profesional.getId(),
                espacio1.getId(), paciente1.getId(), servicio.getId(), "Primera reserva");
        var segunda = new CitaRequest(fecha, LocalTime.parse(segundaHora), profesional.getId(),
                espacio2.getId(), paciente2.getId(), servicio.getId(), "Segunda reserva");
        String token = jwtService.generateToken("admin");

        try (var executor = Executors.newSingleThreadExecutor()) {
            var respuestaConcurrente = transactionTemplate.execute(status -> {
                try {
                    assertThat(reservar(primera, token).getResponse().getStatus()).isEqualTo(201);
                    var solicitudIniciada = new CountDownLatch(1);
                    var pendiente = executor.submit(() -> {
                        solicitudIniciada.countDown();
                        return reservar(segunda, token);
                    });
                    assertThat(solicitudIniciada.await(5, TimeUnit.SECONDS)).isTrue();
                    // La primera cita sigue sin confirmar mientras la segunda solicitud espera el bloqueo.
                    assertThatThrownBy(() -> pendiente.get(1, TimeUnit.SECONDS))
                            .isInstanceOf(TimeoutException.class);
                    return pendiente;
                } catch (Exception e) {
                    throw new IllegalStateException("No se pudo ejecutar la reserva concurrente", e);
                }
            });

            var respuesta = respuestaConcurrente.get(10, TimeUnit.SECONDS).getResponse();
            assertThat(respuesta.getStatus()).isEqualTo(409);
            assertThat(objectMapper.readTree(respuesta.getContentAsByteArray()).path("message").asText())
                    .isEqualTo("El profesional no está disponible en ese horario.");
        }

        assertThat(citaRepository.findByFechaBetween(fecha, fecha))
                .filteredOn(cita -> profesional.getId().equals(cita.getProfesional().getId()))
                .singleElement()
                .satisfies(cita -> assertThat(cita.getMotivo()).isEqualTo("Primera reserva"));
    }

    private MvcResult reservar(CitaRequest request, String token) throws Exception {
        return mockMvc.perform(post("/api/citas")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))).andReturn();
    }
}
