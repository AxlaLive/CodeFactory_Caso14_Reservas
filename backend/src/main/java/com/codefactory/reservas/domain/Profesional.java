package com.codefactory.reservas.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "profesionales")
@Getter
@Setter
@NoArgsConstructor
public class Profesional implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellido;

    @Column(nullable = false, unique = true, length = 20)
    private String documento;

    @Column(nullable = false, length = 100)
    private String especialidad;

    @Column(nullable = false, unique = true, length = 100)
    private String correo;

    @Column(nullable = false)
    private String password = "defaultPassword123";

    @Column(nullable = false)
    private Boolean activo = true;

    @Builder
    public Profesional(Long id, String nombre, String apellido, String documento, String especialidad, String correo, String password, Boolean activo) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.documento = documento;
        this.especialidad = especialidad;
        this.correo = correo;
        this.password = (password != null && !password.isBlank()) ? password : "defaultPassword123";
        this.activo = activo != null ? activo : true;
    }

    @PrePersist
    public void prePersist() {
        if (this.password == null || this.password.isBlank()) {
            this.password = "defaultPassword123";
        }
        if (this.activo == null) {
            this.activo = true;
        }
    }

    // --- MÉTODOS DE SPRING SECURITY ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Asigna ambos roles para dar soporte a endpoints antiguos de pruebas y nuevos de producción
        return List.of(new SimpleGrantedAuthority("ROLE_PROFESIONAL"), new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    @Override
    public String getUsername() {
        return this.correo != null ? this.correo : "admin@dentia.com";
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() {
        return this.activo != null ? this.activo : true;
    }
}