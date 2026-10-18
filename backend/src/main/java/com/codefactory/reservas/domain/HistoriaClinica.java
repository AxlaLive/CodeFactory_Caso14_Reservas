package com.codefactory.reservas.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "historias_clinicas")
public class HistoriaClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profesional_id", nullable = false)
    private Profesional profesional;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;

    @Column(nullable = false, length = 4000)
    private String evolucion;

    @Column(nullable = false, length = 4000)
    private String diagnostico;

    @Column(nullable = false, length = 4000)
    private String tratamiento;

    @Column(nullable = false, length = 4000)
    private String recomendaciones;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    protected HistoriaClinica() {
    }

    public HistoriaClinica(
            Paciente paciente,
            Profesional profesional,
            Cita cita,
            String evolucion,
            String diagnostico,
            String tratamiento,
            String recomendaciones) {
        this.paciente = paciente;
        this.profesional = profesional;
        this.cita = cita;
        this.evolucion = evolucion;
        this.diagnostico = diagnostico;
        this.tratamiento = tratamiento;
        this.recomendaciones = recomendaciones;
    }

    @PrePersist
    void asignarFechaCreacion() {
        creadoEn = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public Profesional getProfesional() {
        return profesional;
    }

    public Cita getCita() {
        return cita;
    }

    public String getEvolucion() {
        return evolucion;
    }

    public String getDiagnostico() {
        return diagnostico;
    }

    public String getTratamiento() {
        return tratamiento;
    }

    public String getRecomendaciones() {
        return recomendaciones;
    }

    public LocalDateTime getCreadoEn() {
        return creadoEn;
    }
}
