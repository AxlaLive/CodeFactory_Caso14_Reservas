package com.codefactory.reservas.dto;

import jakarta.validation.constraints.NotNull;

public record EstadoTrabajadorRequest(@NotNull Boolean active) {
}