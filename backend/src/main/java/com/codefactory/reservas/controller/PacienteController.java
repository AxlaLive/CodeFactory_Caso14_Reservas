package com.codefactory.reservas.controller;

import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.repository.PacienteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    private final PacienteRepository pacienteRepository;

    public PacienteController(PacienteRepository pacienteRepository) {
        this.pacienteRepository = pacienteRepository;
    }

    @GetMapping
    public List<Paciente> listar() {
        return pacienteRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Paciente> crear(@RequestBody Paciente paciente) {
        if (paciente.getNombre() == null || paciente.getNombre().isBlank()
                || paciente.getDocumento() == null || paciente.getDocumento().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        paciente.setNombre(paciente.getNombre().trim());
        paciente.setDocumento(paciente.getDocumento().trim());
        if (pacienteRepository.findByDocumento(paciente.getDocumento()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        paciente.setId(null);
        paciente.setActivo(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(pacienteRepository.save(paciente));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Paciente> actualizar(@PathVariable Long id, @RequestBody Paciente cambios) {
        return pacienteRepository.findById(id)
                .map(paciente -> {
                    if (cambios.getNombre() == null || cambios.getNombre().isBlank()
                            || cambios.getDocumento() == null || cambios.getDocumento().isBlank()) {
                        return ResponseEntity.badRequest().<Paciente>build();
                    }
                    String documento = cambios.getDocumento().trim();
                    if (!documento.equals(paciente.getDocumento())
                            && pacienteRepository.findByDocumento(documento).isPresent()) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).<Paciente>build();
                    }
                    paciente.setNombre(cambios.getNombre().trim());
                    paciente.setDocumento(documento);
                    paciente.setTelefono(cambios.getTelefono());
                    paciente.setCorreo(cambios.getCorreo());
                    return ResponseEntity.ok(pacienteRepository.save(paciente));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
