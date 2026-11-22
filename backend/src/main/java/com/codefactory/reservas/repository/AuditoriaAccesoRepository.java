package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.AuditoriaAcceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditoriaAccesoRepository extends JpaRepository<AuditoriaAcceso, Long> {
    List<AuditoriaAcceso> findByPacienteIdOrderByFechaHoraDesc(Long pacienteId);
}