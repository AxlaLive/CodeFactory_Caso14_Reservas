package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.Cita;
import com.codefactory.reservas.domain.HistoriaClinica;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.dto.HistoriaClinicaRequest;
import com.codefactory.reservas.dto.HistoriaClinicaResponse;
import com.codefactory.reservas.exception.ValidationException;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.HistoriaClinicaRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class HistoriaClinicaService {

    private final HistoriaClinicaRepository historiaRepository;
    private final PacienteRepository pacienteRepository;
    private final ProfesionalRepository profesionalRepository;
    private final CitaRepository citaRepository;
    private final IAuditoriaService auditoriaService;

    public HistoriaClinicaService(
            HistoriaClinicaRepository historiaRepository,
            PacienteRepository pacienteRepository,
            ProfesionalRepository profesionalRepository,
            CitaRepository citaRepository,
            IAuditoriaService auditoriaService) {
        this.historiaRepository = historiaRepository;
        this.pacienteRepository = pacienteRepository;
        this.profesionalRepository = profesionalRepository;
        this.citaRepository = citaRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public List<HistoriaClinicaResponse> consultar(Long pacienteId) {
        if (!pacienteRepository.existsById(pacienteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe el paciente solicitado.");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        boolean esProfesional = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PROFESSIONAL"));

        if (esProfesional) {
            Profesional profesional = obtenerProfesionalAutenticado(username);
            boolean tieneAsignacion = citaRepository.existsByPacienteIdAndProfesionalId(
                    pacienteId, profesional.getId());

            if (!tieneAsignacion) {
                auditoriaService.registrarEvento(
                        username, "PROFESSIONAL", pacienteId, null,
                        "ACCESO_DENEGADO", "Intento de lectura de historia clínica de paciente no asignado");
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Acceso denegado: El paciente no está asignado a su agenda de atención.");
            }

            auditoriaService.registrarEvento(
                    username, "PROFESSIONAL", pacienteId, null,
                    "LECTURA", "Consulta de expediente clínico por profesional asignado");
        } else {
            String rol = auth.getAuthorities().stream()
                    .findFirst().map(Object::toString).orElse("DESCONOCIDO");
            auditoriaService.registrarEvento(
                    username, rol, pacienteId, null,
                    "LECTURA", "Consulta de expediente clínico");
        }

        return historiaRepository.findByPacienteIdOrderByCreadoEnDesc(pacienteId).stream()
                .map(HistoriaClinicaResponse::from)
                .toList();
    }

    @Transactional
    public HistoriaClinicaResponse registrar(Long pacienteId, HistoriaClinicaRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Profesional profesional = obtenerProfesionalAutenticado(username);

        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado."));
        Cita cita = citaRepository.findWithRelationsById(request.citaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada."));

        if (!cita.getPaciente().getId().equals(pacienteId)) {
            throw new ValidationException("La cita seleccionada no corresponde a este paciente.");
        }
        if (!cita.getProfesional().getId().equals(profesional.getId())) {
            auditoriaService.registrarEvento(
                    username, "PROFESSIONAL", pacienteId, null,
                    "ACCESO_DENEGADO", "Intento de registro en cita de otro profesional");
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Solo el profesional asignado a la cita puede registrar la nota.");
        }

        HistoriaClinica historia = new HistoriaClinica(
                paciente,
                profesional,
                cita,
                request.evolucion().strip(),
                request.diagnostico().strip(),
                request.tratamiento().strip(),
                request.recomendaciones().strip());

        HistoriaClinica guardada = historiaRepository.saveAndFlush(historia);

        auditoriaService.registrarEvento(
                username, "PROFESSIONAL", pacienteId, guardada.getId(),
                "CREACION", "Registro de nueva evolución clínica en cita ID: " + cita.getId());

        return HistoriaClinicaResponse.from(guardada);
    }

    private Profesional obtenerProfesionalAutenticado(String username) {
        return profesionalRepository
                .findByUsuarioIgnoreCaseOrCorreoIgnoreCase(username, username)
                .or(() -> profesionalRepository.findByDocumento(username))
                .filter(item -> "PROFESSIONAL".equalsIgnoreCase(item.getRol()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Solo un profesional puede realizar esta operación."));
    }
}