package com.codefactory.reservas.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "espacios_fisicos")
public class EspacioFisico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private boolean activo = true;

    public EspacioFisico() {
    }

    public EspacioFisico(Long id, String nombre, String tipo, boolean activo) {
        this.id = id;
        this.nombre = nombre;
        this.tipo = tipo;
        this.activo = activo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}
