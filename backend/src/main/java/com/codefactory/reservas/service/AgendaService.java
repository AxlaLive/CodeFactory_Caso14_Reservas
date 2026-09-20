package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.Cita;
import com.codefactory.reservas.domain.EspacioFisico;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.domain.Servicio;
import com.codefactory.reservas.dto.CitaRequest;
import com.codefactory.reservas.exception.BusinessConflictException;
import com.codefactory.reservas.exception.ValidationException;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.EspacioFisicoRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import com.codefactory.reservas.repository.ServicioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;

@Service
public class AgendaService {

    private final CitaRepository citaRepository;
    private final ProfesionalRepository profesionalRepository;
    private final EspacioFisicoRepository espacioRepository;
    private final PacienteRepository pacienteRepository;
    private final ServicioRepository servicioRepository;

    public AgendaService(CitaRepository citaRepository,
                        ProfesionalRepository profesionalRepository,
                        EspacioFisicoRepository espacioRepository,
                        PacienteRepository pacienteRepository,
                        ServicioRepository servicioRepository) {
        this.citaRepository = citaRepository;
        this.profesionalRepository = profesionalRepository;
        this.espacioRepository = espacioRepository;
        this.pacienteRepository = pacienteRepository;
        this.servicioRepository = servicioRepository;
    }

    @Transactional
    public Cita crearCitaDesdeAgenda(CitaRequest request) {
        validarRequest(request);

        Profesional profesional = profesionalRepository.findById(request.profesionalId())
                .orElseThrow(() -> new ValidationException("El profesional seleccionado no existe."));
        EspacioFisico espacio = espacioRepository.findById(request.espacioId())
                .orElseThrow(() -> new ValidationException("El espacio físico seleccionado no existe."));
        Paciente paciente = pacienteRepository.findById(request.pacienteId())
                .orElseThrow(() -> new ValidationException("El paciente seleccionado no existe."));
        Servicio servicio = servicioRepository.findById(request.servicioId())
                .orElseThrow(() -> new ValidationException("El servicio seleccionado no existe."));

        LocalTime horaFin = calcularHoraFin(request.horaInicio(), servicio.getDuracionMinutos());

        List<Cita> conflictosProfesional = citaRepository.findConflictsByProfesional(
                request.fecha(), profesional.getId(), request.horaInicio(), horaFin
        );
        if (!conflictosProfesional.isEmpty()) {
            throw new BusinessConflictException("El profesional no está disponible en ese horario.");
        }

        List<Cita> conflictosEspacio = citaRepository.findConflictsByEspacio(
                request.fecha(), espacio.getId(), request.horaInicio(), horaFin
        );
        if (!conflictosEspacio.isEmpty()) {
            throw new BusinessConflictException("El espacio físico no está disponible en ese horario.");
        }

        Cita cita = new Cita();
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

    private void validarRequest(CitaRequest request) {
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

    private LocalTime calcularHoraFin(LocalTime inicio, int duracion) {
        LocalTime fin = inicio.plusMinutes(duracion);
        if (!fin.isAfter(inicio)) {
            throw new ValidationException("La duración del servicio debe generar una franja válida.");
        }
        return fin;
    }
}
