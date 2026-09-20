package com.codefactory.reservas.repository;

import com.codefactory.reservas.domain.Cita;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    @Query("SELECT c FROM Cita c WHERE c.fecha = :fecha AND c.estado <> 'CANCELADA' AND " +
            "((c.horaInicio < :horaFin AND c.horaFin > :horaInicio) OR (c.horaInicio = :horaInicio AND c.horaFin = :horaFin))")
    List<Cita> findOverlappingByDateAndTime(@Param("fecha") LocalDate fecha,
                                            @Param("horaInicio") LocalTime horaInicio,
                                            @Param("horaFin") LocalTime horaFin);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Cita c WHERE c.fecha = :fecha AND c.profesional.id = :profesionalId AND c.estado <> 'CANCELADA' " +
            "AND c.horaInicio < :horaFin AND c.horaFin > :horaInicio")
    List<Cita> findConflictsByProfesional(@Param("fecha") LocalDate fecha,
                                          @Param("profesionalId") Long profesionalId,
                                          @Param("horaInicio") LocalTime horaInicio,
                                          @Param("horaFin") LocalTime horaFin);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Cita c WHERE c.fecha = :fecha AND c.espacioFisico.id = :espacioId AND c.estado <> 'CANCELADA' " +
            "AND c.horaInicio < :horaFin AND c.horaFin > :horaInicio")
    List<Cita> findConflictsByEspacio(@Param("fecha") LocalDate fecha,
                                      @Param("espacioId") Long espacioId,
                                      @Param("horaInicio") LocalTime horaInicio,
                                      @Param("horaFin") LocalTime horaFin);
}
