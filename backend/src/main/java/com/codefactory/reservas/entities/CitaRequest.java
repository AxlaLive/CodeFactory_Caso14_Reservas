package com.codefactory.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record CitaRequest(
        @NotNull(message = "La fecha es obligatoria") LocalDate fecha,
        @NotNull(message = "La hora de inicio es obligatoria") LocalTime horaInicio,
        @NotNull(message = "El profesional es obligatorio") Long profesionalId,
        @NotNull(message = "El espacio es obligatorio") Long espacioId,
        @NotNull(message = "El paciente es obligatorio") Long pacienteId,
        @NotNull(message = "El servicio es obligatorio") Long servicioId,
        @NotBlank(message = "El motivo es obligatorio") String motivo
) {
}
