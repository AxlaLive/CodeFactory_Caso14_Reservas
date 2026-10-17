package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.Disponibilidad;
import com.codefactory.reservas.domain.TipoDisponibilidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface DisponibilidadRepository extends JpaRepository<Disponibilidad, Long> {

    List<Disponibilidad> findByProfesionalIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(
            Long profesionalId, LocalDate inicio, LocalDate fin);

    @Query("""
            SELECT d FROM Disponibilidad d
            WHERE d.profesional.id = :profesionalId
              AND d.fecha = :fecha
              AND d.horaInicio < :horaFin
              AND d.horaFin > :horaInicio
            """)
    List<Disponibilidad> findOverlapping(@Param("profesionalId") Long profesionalId,
                                         @Param("fecha") LocalDate fecha,
                                         @Param("horaInicio") LocalTime horaInicio,
                                         @Param("horaFin") LocalTime horaFin);

    boolean existsByProfesionalIdAndFechaAndTipo(Long profesionalId, LocalDate fecha,
                                                  TipoDisponibilidad tipo);
}
