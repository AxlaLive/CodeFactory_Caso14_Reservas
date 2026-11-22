package com.codefactory.reservas.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditorias_acceso")
@Getter
@NoArgsConstructor
public class AuditoriaAcceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_actor", nullable = false, length = 100)
    private String usuarioActor;

    @Column(name = "rol_actor", nullable = false, length = 30)
    private String rolActor;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    @Column(name = "historia_clinica_id")
    private Long historiaClinicaId;

    @Column(nullable = false, length = 20)
    private String accion; // LECTURA, CREACION, MODIFICACION, ACCESO_DENEGADO

    @Column(nullable = false, length = 255)
    private String detalle;

    @Column(name = "fecha_hora", nullable = false, updatable = false)
    private LocalDateTime fechaHora;

    public AuditoriaAcceso(String usuarioActor, String rolActor, Long pacienteId,
                           Long historiaClinicaId, String accion, String detalle) {
        this.usuarioActor = usuarioActor;
        this.rolActor = rolActor;
        this.pacienteId = pacienteId;
        this.historiaClinicaId = historiaClinicaId;
        this.accion = accion;
        this.detalle = detalle;
    }

    @PrePersist
    void onCreate() {
        this.fechaHora = LocalDateTime.now();
    }
}