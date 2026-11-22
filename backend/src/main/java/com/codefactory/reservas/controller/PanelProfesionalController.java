package com.codefactory.reservas.controller;

import com.codefactory.reservas.dto.AgendaCitaItemResponse;
import com.codefactory.reservas.service.IPanelProfesionalService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/profesionales/mi-agenda")
public class PanelProfesionalController {

    private final IPanelProfesionalService panelProfesionalService;

    public PanelProfesionalController(IPanelProfesionalService panelProfesionalService) {
        this.panelProfesionalService = panelProfesionalService;
    }

    @GetMapping
    public ResponseEntity<List<AgendaCitaItemResponse>> obtenerMiAgenda(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        return ResponseEntity.ok(panelProfesionalService.obtenerMiAgenda(fechaInicio, fechaFin));
    }
}