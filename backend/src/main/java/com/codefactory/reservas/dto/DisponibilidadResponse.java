package com.codefactory.reservas.dto;

import com.codefactory.reservas.domain.Disponibilidad;
import com.codefactory.reservas.domain.TipoDisponibilidad;

import java.time.LocalDate;
import java.time.LocalTime;

public record DisponibilidadResponse(
        Long id,
        Long profesionalId,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        TipoDisponibilidad tipo,
        String motivo
) {
    public static DisponibilidadResponse from(Disponibilidad disponibilidad) {
        return new DisponibilidadResponse(
                disponibilidad.getId(),
                disponibilidad.getProfesional().getId(),
                disponibilidad.getFecha(),
                disponibilidad.getHoraInicio(),
                disponibilidad.getHoraFin(),
                disponibilidad.getTipo(),
                disponibilidad.getMotivo()
        );
    }
}
