package com.codefactory.reservas.dto;

import java.time.LocalDateTime;

public record ClinicalSummaryResponse(
        String resumen,
        LocalDateTime generadoEn,
        String proveedor) {
}
