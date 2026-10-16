package com.codefactory.reservas.controller;

import com.codefactory.reservas.dto.DisponibilidadRequest;
import com.codefactory.reservas.dto.DisponibilidadResponse;
import com.codefactory.reservas.service.DisponibilidadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/disponibilidades")
public class DisponibilidadController {

    private final DisponibilidadService disponibilidadService;

    public DisponibilidadController(DisponibilidadService disponibilidadService) {
        this.disponibilidadService = disponibilidadService;
    }

    @PostMapping
    public ResponseEntity<DisponibilidadResponse> crear(@Valid @RequestBody DisponibilidadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(disponibilidadService.crear(request));
    }

    @GetMapping
    public ResponseEntity<List<DisponibilidadResponse>> consultar(
            @RequestParam(required = false) Long profesionalId,
            @RequestParam(required = false) LocalDate inicio,
            @RequestParam(required = false) LocalDate fin) {
        if (profesionalId == null && inicio == null && fin == null) {
            return ResponseEntity.ok(disponibilidadService.consultarTodas());
        }
        if (profesionalId == null || inicio == null || fin == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(disponibilidadService.consultar(profesionalId, inicio, fin));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DisponibilidadResponse> consultarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(disponibilidadService.consultar(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DisponibilidadResponse> actualizar(
            @PathVariable Long id, @Valid @RequestBody DisponibilidadRequest request) {
        return ResponseEntity.ok(disponibilidadService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        disponibilidadService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
