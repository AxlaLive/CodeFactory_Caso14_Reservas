package com.codefactory.reservas.domain;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "pacientes")
public class Paciente implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String documento;

    @Column(length = 30)
    private String telefono;

    @Column(length = 150, unique = true)
    private String correo;

    @Column(nullable = false)
    private String password = "defaultPassword123";

    @Column(nullable = false)
    private boolean activo = true;

    public Paciente() {
    }

    // Constructor de 4 parámetros (para mantener compatibilidad con CitaServiceTest)
    public Paciente(Long id, String nombre, String documento, boolean activo) {
        this.id = id;
        this.nombre = nombre;
        this.documento = documento;
        this.password = "defaultPassword123";
        this.activo = activo;
    }

    // Constructor de 5 parámetros (con contraseña asignada)
    public Paciente(Long id, String nombre, String documento, String password, boolean activo) {
        this.id = id;
        this.nombre = nombre;
        this.documento = documento;
        this.password = (password != null && !password.isBlank()) ? password : "defaultPassword123";
        this.activo = activo;
    }

    // --- MÉTODOS DE SPRING SECURITY (UserDetails) ---

    @Override
public Collection<? extends GrantedAuthority> getAuthorities() {
    return List.of(
        new SimpleGrantedAuthority("ROLE_PACIENTE"),
        new SimpleGrantedAuthority("ROLE_USER")
    );
}

    @Override
    public String getUsername() {
        return this.correo;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return this.activo;
    }

    // --- GETTERS Y SETTERS TRADICIONALES ---

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

    public String getDocumento() {
        return documento;
    }

    public void setDocumento(String documento) {
        this.documento = documento;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public void setPassword(String password) {
        this.password = (password != null && !password.isBlank()) ? password : "defaultPassword123";
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}