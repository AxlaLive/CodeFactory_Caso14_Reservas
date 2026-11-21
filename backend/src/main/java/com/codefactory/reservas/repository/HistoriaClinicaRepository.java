package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.HistoriaClinica;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, Long> {

    @EntityGraph(attributePaths = {"profesional", "cita"})
    List<HistoriaClinica> findByPacienteIdOrderByCreadoEnDesc(Long pacienteId);

    boolean existsByProfesionalId(Long profesionalId);
}
