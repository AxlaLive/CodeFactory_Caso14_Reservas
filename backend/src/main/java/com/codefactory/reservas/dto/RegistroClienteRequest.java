package com.codefactory.reservas.dto;

import jakarta.validation.constraints.*;

public record RegistroClienteRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 255, message = "El nombre admite hasta 255 caracteres") String nombre,
        @NotBlank(message = "El documento es obligatorio")
        @Size(max = 255, message = "El documento admite hasta 255 caracteres") String documento,
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no es válido")
        @Size(max = 150, message = "El correo admite hasta 150 caracteres") String correo,
        @NotBlank(message = "El teléfono es obligatorio")
        @Pattern(regexp = "[+0-9() .-]{7,30}", message = "El teléfono debe tener entre 7 y 30 caracteres válidos") String telefono,
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres") String password
) {}
