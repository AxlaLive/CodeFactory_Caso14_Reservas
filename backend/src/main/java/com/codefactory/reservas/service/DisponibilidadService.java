package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.Disponibilidad;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.domain.TipoDisponibilidad;
import com.codefactory.reservas.dto.DisponibilidadRequest;
import com.codefactory.reservas.dto.DisponibilidadResponse;
import com.codefactory.reservas.exception.BusinessConflictException;
import com.codefactory.reservas.exception.ValidationException;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.DisponibilidadRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class DisponibilidadService {

    private final DisponibilidadRepository disponibilidadRepository;
    private final ProfesionalRepository profesionalRepository;
    private final CitaRepository citaRepository;

    public DisponibilidadService(DisponibilidadRepository disponibilidadRepository,
                                 ProfesionalRepository profesionalRepository,
                                 CitaRepository citaRepository) {
        this.disponibilidadRepository = disponibilidadRepository;
        this.profesionalRepository = profesionalRepository;
        this.citaRepository = citaRepository;
    }

    @Transactional
    public DisponibilidadResponse crear(DisponibilidadRequest request) {
        validarRango(request);
        Profesional profesional = obtenerProfesional(request.profesionalId());
        validarSinCruces(profesional, request, null);
        return guardar(new Disponibilidad(null, profesional, request.fecha(),
                request.horaInicio(), request.horaFin(), request.tipo(), request.motivo()));
    }

    @Transactional
    public DisponibilidadResponse actualizar(Long id, DisponibilidadRequest request) {
        validarRango(request);
        Disponibilidad disponibilidad = disponibilidadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe la franja de disponibilidad solicitada."));
        Profesional profesional = obtenerProfesional(request.profesionalId());
        validarSinCruces(profesional, request, id);
        disponibilidad.setProfesional(profesional);
        disponibilidad.setFecha(request.fecha());
        disponibilidad.setHoraInicio(request.horaInicio());
        disponibilidad.setHoraFin(request.horaFin());
        disponibilidad.setTipo(request.tipo());
        disponibilidad.setMotivo(request.motivo());
        return guardar(disponibilidad);
    }

    @Transactional
    public List<DisponibilidadResponse> consultar(Long profesionalId, LocalDate inicio, LocalDate fin) {
        if (inicio.isAfter(fin)) {
            throw new ValidationException("La fecha de inicio debe ser anterior o igual a la fecha de fin.");
        }
        if (!profesionalRepository.existsById(profesionalId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe el profesional solicitado.");
        }
        return disponibilidadRepository
                .findByProfesionalIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(profesionalId, inicio, fin)
                .stream()
                .map(DisponibilidadResponse::from)
                .toList();
    }

    public List<DisponibilidadResponse> consultarTodas() {
        return disponibilidadRepository.findAll().stream()
                .map(DisponibilidadResponse::from)
                .toList();
    }

    @Transactional
    public DisponibilidadResponse consultar(Long id) {
        return disponibilidadRepository.findById(id)
                .map(DisponibilidadResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe la franja de disponibilidad solicitada."));
    }

    @Transactional
    public void eliminar(Long id) {
        if (!disponibilidadRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "No existe la franja de disponibilidad solicitada.");
        }
        disponibilidadRepository.deleteById(id);
    }

    private Profesional obtenerProfesional(Long profesionalId) {
        return profesionalRepository.findById(profesionalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe el profesional solicitado."));
    }

    private void validarRango(DisponibilidadRequest request) {
        if (request == null) {
            throw new ValidationException("La solicitud de disponibilidad es obligatoria.");
        }
        if (request.profesionalId() == null || request.fecha() == null
                || request.horaInicio() == null || request.horaFin() == null
                || request.tipo() == null) {
            throw new ValidationException("El profesional, fecha, horas y tipo de disponibilidad son obligatorios.");
        }
        if (!request.horaFin().isAfter(request.horaInicio())) {
            throw new ValidationException("La hora de fin debe ser posterior a la hora de inicio.");
        }
    }

    private void validarSinCruces(Profesional profesional, DisponibilidadRequest request, Long excluirId) {
        List<Disponibilidad> cruces = disponibilidadRepository.findOverlapping(
                profesional.getId(), request.fecha(), request.horaInicio(), request.horaFin());
        if (cruces.stream().anyMatch(item -> !item.getId().equals(excluirId))) {
            throw new BusinessConflictException("La franja se cruza con otra disponibilidad del profesional.");
        }

        if (request.tipo() != TipoDisponibilidad.AVAILABLE
                && !citaRepository.findConflictsByProfesional(request.fecha(), profesional.getId(),
                request.horaInicio(), request.horaFin()).isEmpty()) {
            throw new BusinessConflictException("La franja se cruza con una cita ya programada.");
        }
    }

    private DisponibilidadResponse guardar(Disponibilidad disponibilidad) {
        return DisponibilidadResponse.from(disponibilidadRepository.saveAndFlush(disponibilidad));
    }
}
