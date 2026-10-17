package com.codefactory.reservas.domain;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

@Entity
@Table(name = "profesionales")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profesional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellido;

    @Column(nullable = false, unique = true, length = 20)
    private String documento;

    @Column(length = 100)
    private String especialidad;

    @Column(nullable = false, length = 100)
    private String correo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String rol = "PROFESSIONAL";

    @Column(unique = true, length = 30)
    private String usuario;

    @JsonIgnore
    @Column(name = "password_hash", length = 100)
    private String passwordHash;
}