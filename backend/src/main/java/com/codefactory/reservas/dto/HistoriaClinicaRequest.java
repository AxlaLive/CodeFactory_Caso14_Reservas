package com.codefactory.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record HistoriaClinicaRequest(
        @NotNull Long citaId,
        @NotBlank @Size(max = 4000) String evolucion,
        @NotBlank @Size(max = 4000) String diagnostico,
        @NotBlank @Size(max = 4000) String tratamiento,
        @NotBlank @Size(max = 4000) String recomendaciones) {
}
