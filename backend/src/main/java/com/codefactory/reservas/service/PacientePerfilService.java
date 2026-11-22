package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.Cita;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.dto.PacientePerfilResponse;
import com.codefactory.reservas.dto.PacientePerfilResponse.CitaResumenResponse;
import com.codefactory.reservas.dto.PacientePerfilResponse.HistorialCitaResponse;
import com.codefactory.reservas.exception.ValidationException;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PacientePerfilService {

    private final PacienteRepository pacienteRepository;
    private final CitaRepository citaRepository;

    public PacientePerfilService(PacienteRepository pacienteRepository,
                                 CitaRepository citaRepository) {
        this.pacienteRepository = pacienteRepository;
        this.citaRepository = citaRepository;
    }

    @Transactional(readOnly = true)
    public List<CitaResumenResponse> obtenerProximasCitas(String usernameAutenticado) {
        Paciente paciente = buscarPacienteAutenticado(usernameAutenticado);
        LocalDate hoy = LocalDate.now();

        List<Cita> citas = citaRepository
                .findByPacienteIdAndFechaGreaterThanEqualAndEstadoNotOrderByFechaAscHoraInicioAsc(
                        paciente.getId(),
                        hoy,
                        "CANCELADA"
                );

        return citas.stream()
                .map(this::mapearCitaResumen)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HistorialCitaResponse> obtenerHistorialClinico(String usernameAutenticado) {
        Paciente paciente = buscarPacienteAutenticado(usernameAutenticado);
        LocalDate hoy = LocalDate.now();

        List<Cita> historial = citaRepository.findHistorialClinicoByPacienteId(
                paciente.getId(),
                hoy
        );

        return historial.stream()
                .map(this::mapearHistorialCita)
                .toList();
    }

    @Transactional(readOnly = true)
    public PacientePerfilResponse obtenerPerfilCompleto(String usernameAutenticado) {
        Paciente paciente = buscarPacienteAutenticado(usernameAutenticado);

        return new PacientePerfilResponse(
                paciente.getId(),
                paciente.getNombre(),
                paciente.getDocumento(),
                paciente.isActivo(),
                obtenerProximasCitas(usernameAutenticado),
                obtenerHistorialClinico(usernameAutenticado)
        );
    }

    private Paciente buscarPacienteAutenticado(String usernameAutenticado) {
        if (usernameAutenticado == null || usernameAutenticado.isBlank()) {
            throw new ValidationException("No se pudo identificar al paciente autenticado.");
        }

        Paciente paciente = pacienteRepository.findByDocumento(usernameAutenticado)
                .orElseThrow(() -> new ValidationException(
                        "No existe un paciente registrado con el documento: " + usernameAutenticado
                ));

        if (!paciente.isActivo()) {
            throw new ValidationException("El paciente autenticado se encuentra inactivo.");
        }

        return paciente;
    }

    private CitaResumenResponse mapearCitaResumen(Cita cita) {
        String servicioNombre = cita.getServicio() != null ? cita.getServicio().getNombre() : null;
        String profesionalNombre = cita.getProfesional() != null
                ? (cita.getProfesional().getNombre() + " " + cita.getProfesional().getApellido()).trim()
                : null;
        String espacioNombre = cita.getEspacioFisico() != null ? cita.getEspacioFisico().getNombre() : null;

        return new CitaResumenResponse(
                cita.getId(),
                cita.getFecha(),
                cita.getHoraInicio(),
                cita.getHoraFin(),
                cita.getMotivo(),
                cita.getEstado(),
                servicioNombre,
                profesionalNombre,
                espacioNombre
        );
    }

    private HistorialCitaResponse mapearHistorialCita(Cita cita) {
        String servicioNombre = cita.getServicio() != null ? cita.getServicio().getNombre() : null;
        String profesionalNombre = null;
        String especialidad = null;

        if (cita.getProfesional() != null) {
            profesionalNombre = (cita.getProfesional().getNombre() + " " + cita.getProfesional().getApellido()).trim();
            especialidad = cita.getProfesional().getEspecialidad();
        }

        return new HistorialCitaResponse(
                cita.getId(),
                cita.getFecha(),
                cita.getHoraInicio(),
                cita.getHoraFin(),
                cita.getEstado(),
                cita.getMotivo(),
                servicioNombre,
                profesionalNombre,
                especialidad
        );
    }
}