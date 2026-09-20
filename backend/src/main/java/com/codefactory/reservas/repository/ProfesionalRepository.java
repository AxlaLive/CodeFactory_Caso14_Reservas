package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.Profesional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfesionalRepository extends JpaRepository<Profesional, Long> {
}
