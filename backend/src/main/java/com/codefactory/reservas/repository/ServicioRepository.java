package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServicioRepository extends JpaRepository<Servicio, Long> {
}
