package com.codefactory.reservas.dto;

public record TrabajadorResponse(
        Long id,
        String name,
        String roleType,
        String role,
        String specialty,
        String identification,
        String email,
        String username,
        Boolean active
) {
}