package com.codefactory.reservas.dto;

import com.codefactory.reservas.domain.TipoDisponibilidad;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record DisponibilidadRequest(
        @NotNull(message = "El profesional es obligatorio") Long profesionalId,
        @NotNull(message = "La fecha es obligatoria") LocalDate fecha,
        @NotNull(message = "La hora de inicio es obligatoria") LocalTime horaInicio,
        @NotNull(message = "La hora de fin es obligatoria") LocalTime horaFin,
        @NotNull(message = "El tipo de disponibilidad es obligatorio") TipoDisponibilidad tipo,
        @Size(max = 200, message = "El motivo no puede superar 200 caracteres") String motivo
) {
}
