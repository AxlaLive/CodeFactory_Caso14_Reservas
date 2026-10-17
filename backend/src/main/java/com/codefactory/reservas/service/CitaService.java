package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.Cita;
import com.codefactory.reservas.domain.EspacioFisico;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.domain.Servicio;
import com.codefactory.reservas.domain.Disponibilidad;
import com.codefactory.reservas.domain.TipoDisponibilidad;
import com.codefactory.reservas.dto.CitaRequest;
import com.codefactory.reservas.exception.BusinessConflictException;
import com.codefactory.reservas.exception.ValidationException;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.DisponibilidadRepository;
import com.codefactory.reservas.repository.EspacioFisicoRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import com.codefactory.reservas.repository.ServicioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class CitaService {

    private final CitaRepository citaRepository;
    private final DisponibilidadRepository disponibilidadRepository;
    private final ProfesionalRepository profesionalRepository;
    private final EspacioFisicoRepository espacioRepository;
    private final PacienteRepository pacienteRepository;
    private final ServicioRepository servicioRepository;

    public CitaService(CitaRepository citaRepository,
                       DisponibilidadRepository disponibilidadRepository,
                       ProfesionalRepository profesionalRepository,
                       EspacioFisicoRepository espacioRepository,
                       PacienteRepository pacienteRepository,
                       ServicioRepository servicioRepository) {
        this.citaRepository = citaRepository;
        this.disponibilidadRepository = disponibilidadRepository;
        this.profesionalRepository = profesionalRepository;
        this.espacioRepository = espacioRepository;
        this.pacienteRepository = pacienteRepository;
        this.servicioRepository = servicioRepository;
    }

    @Transactional
    public Cita crearDesdeAgenda(CitaRequest request) {
        return guardarDesdeAgenda(request, null);
    }

    @Transactional
    public Optional<Cita> actualizarDesdeAgenda(Long citaId, CitaRequest request) {
        return citaRepository.findById(citaId)
                .filter(cita -> !"CANCELADA".equals(cita.getEstado()))
                .map(cita -> guardarDesdeAgenda(request, cita));
    }

    private Cita guardarDesdeAgenda(CitaRequest request, Cita citaExistente) {
        validarCamposObligatorios(request);

        Profesional profesional = profesionalRepository.findById(request.profesionalId())
                .orElseThrow(() -> new ValidationException("El profesional seleccionado no existe."));
        EspacioFisico espacio = espacioRepository.findById(request.espacioId())
                .orElseThrow(() -> new ValidationException("El espacio físico seleccionado no existe."));
        Paciente paciente = pacienteRepository.findById(request.pacienteId())
                .orElseThrow(() -> new ValidationException("El paciente seleccionado no existe."));
        Servicio servicio = servicioRepository.findById(request.servicioId())
                .orElseThrow(() -> new ValidationException("El servicio seleccionado no existe."));

        LocalTime horaFin = request.horaInicio().plusMinutes(servicio.getDuracionMinutos());

        if (!horaFin.isAfter(request.horaInicio())) {
            throw new ValidationException("La hora de fin debe ser posterior a la hora de inicio.");
        }

        List<Disponibilidad> franjas =
                disponibilidadRepository.findOverlapping(request.profesionalId(), request.fecha(),
                        request.horaInicio(), horaFin);
        boolean tieneDisponibilidadDefinida = disponibilidadRepository
                .existsByProfesionalIdAndFechaAndTipo(request.profesionalId(), request.fecha(),
                        TipoDisponibilidad.AVAILABLE);
        boolean cubiertoPorDisponibilidad = franjas.stream()
                .anyMatch(franja -> franja.getTipo() == TipoDisponibilidad.AVAILABLE
                        && !franja.getHoraInicio().isAfter(request.horaInicio())
                        && !franja.getHoraFin().isBefore(horaFin));
        boolean cruzaBloqueo = franjas.stream()
                .anyMatch(franja -> franja.getTipo() != TipoDisponibilidad.AVAILABLE);
        if (cruzaBloqueo || (tieneDisponibilidadDefinida && !cubiertoPorDisponibilidad)) {
            throw new BusinessConflictException("El profesional no está disponible en ese horario.");
        }

        List<Cita> conflictosProfesional = citaExistente == null
                ? citaRepository.findConflictsByProfesional(request.fecha(), request.profesionalId(),
                        request.horaInicio(), horaFin)
                : citaRepository.findConflictsByProfesionalExcludingCita(request.fecha(),
                        request.profesionalId(), request.horaInicio(), horaFin, citaExistente.getId());
        if (!conflictosProfesional.isEmpty()) {
            throw new BusinessConflictException("El profesional no está disponible en ese horario.");
        }

        List<Cita> conflictosEspacio = citaExistente == null
                ? citaRepository.findConflictsByEspacio(request.fecha(), request.espacioId(),
                        request.horaInicio(), horaFin)
                : citaRepository.findConflictsByEspacioExcludingCita(request.fecha(),
                        request.espacioId(), request.horaInicio(), horaFin, citaExistente.getId());
        if (!conflictosEspacio.isEmpty()) {
            throw new BusinessConflictException("El espacio físico no está disponible en ese horario.");
        }

        Cita cita = citaExistente == null ? new Cita() : citaExistente;
        cita.setFecha(request.fecha());
        cita.setHoraInicio(request.horaInicio());
        cita.setHoraFin(horaFin);
        cita.setProfesional(profesional);
        cita.setEspacioFisico(espacio);
        cita.setPaciente(paciente);
        cita.setServicio(servicio);
        cita.setMotivo(request.motivo());
        cita.setEstado("PROGRAMADA");

        return citaRepository.save(cita);
    }

    private void validarCamposObligatorios(CitaRequest request) {
        if (request == null) {
            throw new ValidationException("La solicitud es obligatoria.");
        }
        if (request.fecha() == null) {
            throw new ValidationException("La fecha es obligatoria.");
        }
        if (request.horaInicio() == null) {
            throw new ValidationException("La hora de inicio es obligatoria.");
        }
        if (request.profesionalId() == null) {
            throw new ValidationException("El profesional es obligatorio.");
        }
        if (request.espacioId() == null) {
            throw new ValidationException("El espacio es obligatorio.");
        }
        if (request.pacienteId() == null) {
            throw new ValidationException("El paciente es obligatorio.");
        }
        if (request.servicioId() == null) {
            throw new ValidationException("El servicio es obligatorio.");
        }
        if (request.motivo() == null || request.motivo().isBlank()) {
            throw new ValidationException("El motivo es obligatorio.");
        }
    }
    public List<Cita> consultarPorRangoFechas(LocalDate inicio, LocalDate fin) {
        return citaRepository.findByFechaBetween(inicio, fin);
    }

    @Transactional
    public Optional<Cita> cancelar(Long id) {
        return citaRepository.findById(id).map(cita -> {
            cita.setEstado("CANCELADA");
            return citaRepository.save(cita);
        });
    }
}
