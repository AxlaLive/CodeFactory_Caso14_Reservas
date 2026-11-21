package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByDocumento(String documento);
}