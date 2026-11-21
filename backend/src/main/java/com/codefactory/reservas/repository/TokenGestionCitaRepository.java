
package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.TokenGestionCita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenGestionCitaRepository
        extends JpaRepository<TokenGestionCita, Long> {

    Optional<TokenGestionCita> findByToken(String token);
}
