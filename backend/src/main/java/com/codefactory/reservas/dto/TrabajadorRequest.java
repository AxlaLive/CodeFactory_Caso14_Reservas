package com.codefactory.reservas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TrabajadorRequest(
        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 201, message = "El nombre no puede superar 201 caracteres.")
        String name,

        @NotBlank(message = "Selecciona un rol.")
        String roleType,

        String specialty,

        @NotBlank(message = "La identificación es obligatoria.")
        @Pattern(regexp = "[0-9]{5,15}", message = "La identificación debe tener entre 5 y 15 dígitos.")
        String identification,

        @NotBlank(message = "El correo es obligatorio.")
        @Email(message = "El correo no es válido.")
        @Size(max = 100, message = "El correo no puede superar 100 caracteres.")
        String email,

        @NotBlank(message = "El usuario es obligatorio.")
        @Pattern(regexp = "[A-Za-z0-9._-]{4,30}", message = "El usuario debe tener entre 4 y 30 caracteres válidos.")
        String username,

        @NotBlank(message = "La contraseña es obligatoria.")
        @Size(min = 6, max = 72, message = "La contraseña debe tener entre 6 y 72 caracteres.")
        String password
) {
}