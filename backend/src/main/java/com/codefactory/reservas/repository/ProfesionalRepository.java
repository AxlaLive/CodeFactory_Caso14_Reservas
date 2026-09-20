package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.Profesional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfesionalRepository extends JpaRepository<Profesional, Long> {
    Optional<Profesional> findByDocumento(String documento);
}