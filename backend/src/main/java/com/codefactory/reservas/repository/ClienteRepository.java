package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    boolean existsByCorreoOrDocumento(String correo, String documento);

    boolean existsByCorreoIgnoreCase(String correo);

    Optional<Cliente> findByCorreoIgnoreCase(String correo);

    Optional<Cliente> findByCorreo(String correo);

    Optional<Cliente> findByDocumento(String documento);
}
