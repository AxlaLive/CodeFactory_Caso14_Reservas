package com.codefactory.reservas.controller;

import com.codefactory.reservas.domain.Cita;
import com.codefactory.reservas.dto.CitaRequest;
import com.codefactory.reservas.exception.BusinessConflictException;
import com.codefactory.reservas.exception.ValidationException;
import com.codefactory.reservas.service.CitaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @PostMapping
    public ResponseEntity<?> crearCita(@Valid @RequestBody CitaRequest request) {
        try {
            Cita cita = citaService.crearDesdeAgenda(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(cita);
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (BusinessConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }
    @GetMapping("/rango")
    public ResponseEntity<List<Cita>> consultarAgendaPorRango(
            @RequestParam("inicio") LocalDate inicio,
            @RequestParam("fin") LocalDate fin) {
        List<Cita> citas = citaService.consultarPorRangoFechas(inicio, fin);
        return ResponseEntity.ok(citas);
    }
}
