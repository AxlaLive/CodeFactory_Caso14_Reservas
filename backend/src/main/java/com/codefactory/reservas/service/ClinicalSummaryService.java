package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.Cliente;
import com.codefactory.reservas.domain.HistoriaClinica;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.dto.ClinicalSummaryRequest;
import com.codefactory.reservas.dto.ClinicalSummaryResponse;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.ClienteRepository;
import com.codefactory.reservas.repository.HistoriaClinicaRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ClinicalSummaryService {

    private static final int MAX_RECORDS = 12;
    private static final int MAX_FIELD_LENGTH = 800;

    private final HistoriaClinicaRepository historiaRepository;
    private final PacienteRepository pacienteRepository;
    private final ClienteRepository clienteRepository;
    private final ProfesionalRepository profesionalRepository;
    private final CitaRepository citaRepository;
    private final ClinicalSummarySanitizer sanitizer;
    private final ClinicalSummaryGenerator summaryGenerator;
    private final String provider;

    public ClinicalSummaryService(
            HistoriaClinicaRepository historiaRepository,
            PacienteRepository pacienteRepository,
            ClienteRepository clienteRepository,
            ProfesionalRepository profesionalRepository,
            CitaRepository citaRepository,
            ClinicalSummarySanitizer sanitizer,
            ClinicalSummaryGenerator summaryGenerator,
            @Value("${ai.provider:groq}") String provider) {
        this.historiaRepository = historiaRepository;
        this.pacienteRepository = pacienteRepository;
        this.clienteRepository = clienteRepository;
        this.profesionalRepository = profesionalRepository;
        this.citaRepository = citaRepository;
        this.sanitizer = sanitizer;
        this.summaryGenerator = summaryGenerator;
        this.provider = provider;
    }

    public ClinicalSummaryResponse generate(ClinicalSummaryRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión.");
        }

        List<String> roles = authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .toList();
        Paciente patient;
        if (roles.contains("ROLE_CLIENTE")) {
            Cliente client = clienteRepository.findByCorreoIgnoreCase(authentication.getName())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.FORBIDDEN, "La cuenta no está vinculada a un paciente."));
            patient = client.getPaciente();
            if (request != null && request.documentoPaciente() != null
                    && !request.documentoPaciente().isBlank()
                    && !request.documentoPaciente().equals(patient.getDocumento())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Solo puedes solicitar el resumen de tu propia historia clínica.");
            }
        } else {
            String patientDocument = request == null ? null : request.documentoPaciente();
            if (patientDocument == null || patientDocument.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes indicar el documento del paciente.");
            }
            patient = pacienteRepository.findByDocumento(patientDocument.strip())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado."));
            if (roles.contains("ROLE_PROFESSIONAL")) {
                Profesional professional = profesionalRepository
                        .findByUsuarioIgnoreCaseOrCorreoIgnoreCase(authentication.getName(), authentication.getName())
                        .or(() -> profesionalRepository.findByDocumento(authentication.getName()))
                        .filter(item -> "PROFESSIONAL".equalsIgnoreCase(item.getRol()))
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.FORBIDDEN, "No se encontró el profesional autenticado."));
                if (!citaRepository.existsByPacienteIdAndProfesionalId(patient.getId(), professional.getId())) {
                    throw new ResponseStatusException(
                            HttpStatus.FORBIDDEN, "No tienes una cita asignada con este paciente.");
                }
            } else if (!roles.contains("ROLE_ADMIN")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para esta operación.");
            }
        }

        List<HistoriaClinica> histories = historiaRepository
                .findByPacienteIdOrderByCreadoEnDesc(patient.getId());
        if (histories.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El paciente aún no tiene historia clínica registrada.");
        }

        String anonymizedData = histories.stream()
                .limit(MAX_RECORDS)
                .map(history -> formatHistory(history, patient))
                .reduce((first, second) -> first + "\n\n" + second)
                .orElseThrow();
        String summary = summaryGenerator.generate(anonymizedData);
        if (summary == null || summary.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "El proveedor de IA devolvió un resumen vacío.");
        }
        String providerName = "azure".equalsIgnoreCase(provider) ? "Azure OpenAI" : "Groq";
        return new ClinicalSummaryResponse(summary, LocalDateTime.now(), providerName);
    }

    private String formatHistory(HistoriaClinica history, Paciente patient) {
        return """
                Fecha de atención: %s
                Evolución: %s
                Diagnóstico registrado: %s
                Tratamiento registrado: %s
                Recomendaciones registradas: %s
                """.formatted(
                history.getCita().getFecha(),
                sanitizeAndLimit(history.getEvolucion(), patient),
                sanitizeAndLimit(history.getDiagnostico(), patient),
                sanitizeAndLimit(history.getTratamiento(), patient),
                sanitizeAndLimit(history.getRecomendaciones(), patient));
    }

    private String sanitizeAndLimit(String text, Paciente patient) {
        String sanitized = sanitizer.sanitize(text, patient);
        return sanitized.length() <= MAX_FIELD_LENGTH
                ? sanitized
                : sanitized.substring(0, MAX_FIELD_LENGTH);
    }
}
