package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByCorreo(String correo);
    boolean existsByCorreoOrDocumento(String correo, String documento);
}
