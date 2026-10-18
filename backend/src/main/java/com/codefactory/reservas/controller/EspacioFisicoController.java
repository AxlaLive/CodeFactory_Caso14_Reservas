package com.codefactory.reservas.controller;

import com.codefactory.reservas.domain.EspacioFisico;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.EspacioFisicoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/espacios")
public class EspacioFisicoController {

    private final EspacioFisicoRepository espacioRepository;
    private final CitaRepository citaRepository;

    public EspacioFisicoController(
            EspacioFisicoRepository espacioRepository,
            CitaRepository citaRepository) {
        this.espacioRepository = espacioRepository;
        this.citaRepository = citaRepository;
    }

    @GetMapping
    public List<EspacioFisico> listar() {
        return espacioRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<EspacioFisico> crear(@RequestBody EspacioFisico espacio) {
        return ResponseEntity.status(HttpStatus.CREATED).body(espacioRepository.save(espacio));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EspacioFisico> actualizar(
            @PathVariable Long id, @RequestBody EspacioFisico cambios) {
        if (cambios.getNombre() == null || cambios.getNombre().isBlank()
                || cambios.getTipo() == null || cambios.getTipo().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return espacioRepository.findById(id)
                .map(espacio -> {
                    espacio.setNombre(cambios.getNombre().trim());
                    espacio.setTipo(cambios.getTipo().trim());
                    espacio.setActivo(cambios.isActivo());
                    if (espacioRepository.existsByNombreIgnoreCaseAndIdNot(espacio.getNombre(), id)) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).<EspacioFisico>build();
                    }
                    return ResponseEntity.ok(espacioRepository.save(espacio));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return espacioRepository.findById(id)
                .<ResponseEntity<?>>map(espacio -> {
                    if (citaRepository.existsByEspacioFisicoId(id)) {
                        espacio.setActivo(false);
                        return ResponseEntity.ok(espacioRepository.save(espacio));
                    }
                    espacioRepository.delete(espacio);
                    return ResponseEntity.noContent().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
