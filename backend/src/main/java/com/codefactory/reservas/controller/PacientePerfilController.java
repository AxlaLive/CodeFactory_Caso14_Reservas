package com.codefactory.reservas.controller;

import com.codefactory.reservas.dto.PacientePerfilResponse;
import com.codefactory.reservas.dto.PacientePerfilResponse.CitaResumenResponse;
import com.codefactory.reservas.dto.PacientePerfilResponse.HistorialCitaResponse;
import com.codefactory.reservas.exception.ValidationException;
import com.codefactory.reservas.service.PacientePerfilService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pacientes/me")
@PreAuthorize("hasRole('PACIENTE')")
public class PacientePerfilController {

    private final PacientePerfilService pacientePerfilService;

    public PacientePerfilController(PacientePerfilService pacientePerfilService) {
        this.pacientePerfilService = pacientePerfilService;
    }

    @GetMapping
    public ResponseEntity<?> obtenerMiPerfil(Authentication authentication) {
        try {
            String documentoAutenticado = authentication != null ? authentication.getName() : null;
            PacientePerfilResponse perfil = pacientePerfilService.obtenerPerfilCompleto(documentoAutenticado);
            return ResponseEntity.ok(perfil);
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/proximas-citas")
    public ResponseEntity<?> listarProximasCitas(Authentication authentication) {
        try {
            String documentoAutenticado = authentication != null ? authentication.getName() : null;
            List<CitaResumenResponse> citas = pacientePerfilService.obtenerProximasCitas(documentoAutenticado);
            return ResponseEntity.ok(citas);
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/historial-clinico")
    public ResponseEntity<?> consultarHistorialClinico(Authentication authentication) {
        try {
            String documentoAutenticado = authentication != null ? authentication.getName() : null;
            List<HistorialCitaResponse> historial = pacientePerfilService.obtenerHistorialClinico(documentoAutenticado);
            return ResponseEntity.ok(historial);
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}