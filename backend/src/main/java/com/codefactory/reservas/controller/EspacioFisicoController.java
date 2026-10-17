package com.codefactory.reservas.controller;

import com.codefactory.reservas.domain.EspacioFisico;
import com.codefactory.reservas.repository.EspacioFisicoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/espacios")
public class EspacioFisicoController {

    private final EspacioFisicoRepository espacioRepository;

    public EspacioFisicoController(EspacioFisicoRepository espacioRepository) {
        this.espacioRepository = espacioRepository;
    }

    @GetMapping
    public List<EspacioFisico> listar() {
        return espacioRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<EspacioFisico> crear(@RequestBody EspacioFisico espacio) {
        return ResponseEntity.status(HttpStatus.CREATED).body(espacioRepository.save(espacio));
    }
}
