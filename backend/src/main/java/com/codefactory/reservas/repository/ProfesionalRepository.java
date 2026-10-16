package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.Profesional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfesionalRepository extends JpaRepository<Profesional, Long> {
    Optional<Profesional> findByDocumento(String documento);
    Optional<Profesional> findByUsuarioIgnoreCase(String usuario);
    Optional<Profesional> findByUsuarioIgnoreCaseOrCorreoIgnoreCase(String usuario, String correo);
    boolean existsByDocumento(String documento);
    boolean existsByUsuarioIgnoreCase(String usuario);
    boolean existsByCorreoIgnoreCase(String correo);
    List<Profesional> findAllByOrderByNombreAscApellidoAsc();
}