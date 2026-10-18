package com.codefactory.reservas.controller;

import com.codefactory.reservas.dto.HistoriaClinicaRequest;
import com.codefactory.reservas.dto.HistoriaClinicaResponse;
import com.codefactory.reservas.service.HistoriaClinicaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pacientes/{pacienteId}/historia-clinica")
public class HistoriaClinicaController {

    private final HistoriaClinicaService historiaClinicaService;

    public HistoriaClinicaController(HistoriaClinicaService historiaClinicaService) {
        this.historiaClinicaService = historiaClinicaService;
    }

    @GetMapping
    public ResponseEntity<List<HistoriaClinicaResponse>> consultar(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(historiaClinicaService.consultar(pacienteId));
    }

    @PostMapping
    public ResponseEntity<HistoriaClinicaResponse> registrar(
            @PathVariable Long pacienteId,
            @Valid @RequestBody HistoriaClinicaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(historiaClinicaService.registrar(pacienteId, request));
    }
}
