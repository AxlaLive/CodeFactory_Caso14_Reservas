package com.codefactory.reservas.dto;

import com.codefactory.reservas.domain.HistoriaClinica;

import java.time.LocalDateTime;

public record HistoriaClinicaResponse(
        Long id,
        Long citaId,
        String fechaCita,
        String profesional,
        String evolucion,
        String diagnostico,
        String tratamiento,
        String recomendaciones,
        LocalDateTime creadoEn) {

    public static HistoriaClinicaResponse from(HistoriaClinica historia) {
        var profesional = historia.getProfesional();
        var cita = historia.getCita();
        return new HistoriaClinicaResponse(
                historia.getId(),
                cita.getId(),
                cita.getFecha().toString(),
                (profesional.getNombre() + " " + profesional.getApellido()).trim(),
                historia.getEvolucion(),
                historia.getDiagnostico(),
                historia.getTratamiento(),
                historia.getRecomendaciones(),
                historia.getCreadoEn());
    }
}
