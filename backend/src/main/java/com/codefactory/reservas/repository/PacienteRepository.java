package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    java.util.Optional<Paciente> findByDocumento(String documento);
    java.util.Optional<Paciente> findByCorreo(String correo); // Nueva línea
}