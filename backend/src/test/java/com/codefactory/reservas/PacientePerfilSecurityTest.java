package com.codefactory.reservas;

import com.codefactory.reservas.domain.Cita;
import com.codefactory.reservas.domain.EspacioFisico;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.domain.Servicio;
import com.codefactory.reservas.dto.PacientePerfilResponse;
import com.codefactory.reservas.exception.ValidationException;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import com.codefactory.reservas.service.PacientePerfilService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PacientePerfilSecurityTest {

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private CitaRepository citaRepository;

    @InjectMocks
    private PacientePerfilService pacientePerfilService;

    @Test
    void pacienteAutenticadoSoloConsultaSusPropiasCitasEHistorialYNoLosDeOtroPaciente() {
        Paciente pacienteA = new Paciente(1L, "Paciente Uno", "11111111", true);
        Profesional profesional = Profesional.builder()
                .id(5L)
                .nombre("Ana")
                .apellido("Pérez")
                .especialidad("Odontología general")
                .build();
        EspacioFisico espacio = new EspacioFisico();
        espacio.setId(1L);
        espacio.setNombre("Consultorio 1");

        Servicio servicio = new Servicio();
        servicio.setId(1L);
        servicio.setNombre("Profilaxis");

        Cita citaPropia = new Cita(
                10L,
                LocalDate.now().plusDays(2),
                LocalTime.of(10, 0),
                LocalTime.of(10, 30),
                profesional,
                espacio,
                pacienteA,
                servicio,
                "Revisión propia",
                "PROGRAMADA"
        );

        Cita historialPropio = new Cita(
                9L,
                LocalDate.now().minusDays(5),
                LocalTime.of(15, 0),
                LocalTime.of(15, 30),
                profesional,
                espacio,
                pacienteA,
                servicio,
                "Limpieza previa",
                "ATENDIDA"
        );

        when(pacienteRepository.findByDocumento("11111111")).thenReturn(Optional.of(pacienteA));
        when(citaRepository.findByPacienteIdAndFechaGreaterThanEqualAndEstadoNotOrderByFechaAscHoraInicioAsc(
                eq(1L), any(LocalDate.class), eq("CANCELADA")
        )).thenReturn(List.of(citaPropia));
        when(citaRepository.findHistorialClinicoByPacienteId(eq(1L), any(LocalDate.class)))
                .thenReturn(List.of(historialPropio));

        PacientePerfilResponse perfil = pacientePerfilService.obtenerPerfilCompleto("11111111");

        assertEquals(1L, perfil.getId());
        assertEquals("11111111", perfil.getDocumento());
        assertEquals(1, perfil.getProximasCitas().size());
        assertEquals("Revisión propia", perfil.getProximasCitas().get(0).getMotivo());
        assertEquals(1, perfil.getHistorialClinico().size());
        assertEquals("Limpieza previa", perfil.getHistorialClinico().get(0).getMotivoConsulta());

        // Garantiza que las consultas siempre filtran por el ID del paciente autenticado (1L)
        verify(citaRepository).findByPacienteIdAndFechaGreaterThanEqualAndEstadoNotOrderByFechaAscHoraInicioAsc(
                eq(1L), any(LocalDate.class), eq("CANCELADA")
        );
        verify(citaRepository).findHistorialClinicoByPacienteId(eq(1L), any(LocalDate.class));
    }

    @Test
    void rechazaAccesoCuandoNoHayIdentidadAutenticadaOElPacienteNoExiste() {
        assertThrows(ValidationException.class,
                () -> pacientePerfilService.obtenerProximasCitas("   "));

        when(pacienteRepository.findByDocumento("22222222")).thenReturn(Optional.empty());
        assertThrows(ValidationException.class,
                () -> pacientePerfilService.obtenerHistorialClinico("22222222"));
    }

    @Test
    void rechazaAccesoCuandoElPacienteEstaInactivo() {
        Paciente pacienteInactivo = new Paciente(3L, "Paciente Inactivo", "33333333", false);
        when(pacienteRepository.findByDocumento("33333333")).thenReturn(Optional.of(pacienteInactivo));

        assertThrows(ValidationException.class,
                () -> pacientePerfilService.obtenerPerfilCompleto("33333333"));
    }
}