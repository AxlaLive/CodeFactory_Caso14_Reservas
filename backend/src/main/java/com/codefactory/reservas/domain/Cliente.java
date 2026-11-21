package com.codefactory.reservas.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "clientes")
@Getter
@Setter
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String correo;

    @Column(nullable = false, unique = true)
    private String documento;

    @Column(name = "password_hash", nullable = false, length = 60)
    private String passwordHash;

    @OneToOne(optional = false)
    @JoinColumn(name = "paciente_id", nullable = false, unique = true)
    private Paciente paciente;
}
