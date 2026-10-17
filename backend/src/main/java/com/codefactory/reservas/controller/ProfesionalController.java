package com.codefactory.reservas.controller;

import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.service.ProfesionalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profesionales")
@CrossOrigin(origins = "*")
public class ProfesionalController {

    private final ProfesionalService profesionalService;

    public ProfesionalController(ProfesionalService profesionalService) {
        this.profesionalService = profesionalService;
    }

    @GetMapping
    public ResponseEntity<List<Profesional>> listarProfesionales() {
        return ResponseEntity.ok(profesionalService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profesional> obtenerProfesionalPorId(@PathVariable Long id) {
        return profesionalService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Profesional> crearProfesional(@RequestBody Profesional profesional) {
        Profesional nuevo = profesionalService.guardar(profesional);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Profesional> actualizarProfesional(@PathVariable Long id, @RequestBody Profesional profesional) {
        try {
            Profesional actualizado = profesionalService.actualizar(id, profesional);
            return ResponseEntity.ok(actualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProfesional(@PathVariable Long id) {
        profesionalService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}