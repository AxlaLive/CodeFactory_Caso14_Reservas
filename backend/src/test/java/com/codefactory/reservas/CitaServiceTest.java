package com.codefactory.reservas;

import com.codefactory.reservas.domain.Cita;
import com.codefactory.reservas.domain.EspacioFisico;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.domain.Servicio;
import com.codefactory.reservas.dto.CitaRequest;
import com.codefactory.reservas.exception.BusinessConflictException;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.EspacioFisicoRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import com.codefactory.reservas.repository.ServicioRepository;
import com.codefactory.reservas.service.CitaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@Import(CitaService.class)
class CitaServiceTest {

    @Autowired
    private CitaService citaService;

    @Autowired
    private ProfesionalRepository profesionalRepository;

    @Autowired
    private EspacioFisicoRepository espacioRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private ServicioRepository servicioRepository;

    @Autowired
    private CitaRepository citaRepository;

    private Profesional profesional;
    private EspacioFisico espacio;
    private Paciente paciente;
    private Servicio servicio;

    @BeforeEach
    void setUp() {
        profesional = profesionalRepository.save(new Profesional(null, "Dr. Ramírez", true));
        espacio = espacioRepository.save(new EspacioFisico(null, "Consultorio 1", "CONSULTORIO", true));
        paciente = pacienteRepository.save(new Paciente(null, "Ana García", "12345678", true));
        servicio = servicioRepository.save(new Servicio(null, "Consulta general", 30));
    }

    @Test
    void shouldCreateAppointmentWhenNoConflictExists() {
        CitaRequest request = new CitaRequest(
                LocalDate.of(2026, 9, 20),
                LocalTime.of(9, 0),
                profesional.getId(),
                espacio.getId(),
                paciente.getId(),
                servicio.getId(),
                "Consulta inicial"
        );

        Cita saved = citaService.crearDesdeAgenda(request);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getHoraFin()).isEqualTo(LocalTime.of(9, 30));
        assertThat(citaRepository.count()).isEqualTo(1);
    }

    @Test
    void shouldRejectAppointmentWhenProfessionalHasOverlap() {
        citaRepository.save(new Cita(
                null,
                LocalDate.of(2026, 9, 20),
                LocalTime.of(9, 0),
                LocalTime.of(9, 30),
                profesional,
                espacio,
                paciente,
                servicio,
                "Consulta previa",
                "PROGRAMADA"
        ));

        CitaRequest request = new CitaRequest(
                LocalDate.of(2026, 9, 20),
                LocalTime.of(9, 15),
                profesional.getId(),
                espacio.getId(),
                paciente.getId(),
                servicio.getId(),
                "Consulta nueva"
        );

        assertThatThrownBy(() -> citaService.crearDesdeAgenda(request))
                .isInstanceOf(BusinessConflictException.class)
                .hasMessageContaining("profesional");
    }

    @Test
    void shouldRejectAppointmentWhenPhysicalSpaceHasOverlap() {
        citaRepository.save(new Cita(
                null,
                LocalDate.of(2026, 9, 20),
                LocalTime.of(9, 0),
                LocalTime.of(9, 30),
                profesional,
                espacio,
                paciente,
                servicio,
                "Consulta previa",
                "PROGRAMADA"
        ));

        Profesional otroProfesional = profesionalRepository.save(new Profesional(null, "Dra. López", true));

        CitaRequest request = new CitaRequest(
                LocalDate.of(2026, 9, 20),
                LocalTime.of(9, 20),
                otroProfesional.getId(),
                espacio.getId(),
                paciente.getId(),
                servicio.getId(),
                "Otra consulta"
        );

        assertThatThrownBy(() -> citaService.crearDesdeAgenda(request))
                .isInstanceOf(BusinessConflictException.class)
                .hasMessageContaining("espacio");
    }
}
