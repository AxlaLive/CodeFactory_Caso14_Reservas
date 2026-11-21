package com.codefactory.reservas.controller;

import com.codefactory.reservas.dto.EstadoTrabajadorRequest;
import com.codefactory.reservas.dto.TrabajadorRequest;
import com.codefactory.reservas.dto.TrabajadorResponse;
import com.codefactory.reservas.service.TrabajadorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trabajadores")
public class TrabajadorController {

    private final TrabajadorService trabajadorService;

    public TrabajadorController(TrabajadorService trabajadorService) {
        this.trabajadorService = trabajadorService;
    }

    @GetMapping
    public ResponseEntity<List<TrabajadorResponse>> listar() {
        return ResponseEntity.ok(trabajadorService.listar());
    }

    @PostMapping
    public ResponseEntity<TrabajadorResponse> crear(@Valid @RequestBody TrabajadorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(trabajadorService.crear(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TrabajadorResponse> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody EstadoTrabajadorRequest request
    ) {
        return ResponseEntity.ok(trabajadorService.actualizarEstado(id, request.active()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        if (trabajadorService.eliminar(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(trabajadorService.listar().stream()
                .filter(trabajador -> trabajador.id().equals(id))
                .findFirst()
                .orElseThrow());
    }
}