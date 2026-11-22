package com.codefactory.reservas.dto;

import com.codefactory.reservas.domain.Cita;

import java.time.LocalDate;
import java.time.LocalTime;

public record AgendaCitaItemResponse(
        Long citaId,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        String estado,
        String motivo,
        Long pacienteId,
        String pacienteNombre,
        String pacienteDocumento,
        String servicioNombre,
        String espacioNombre
) {
    public static AgendaCitaItemResponse from(Cita cita) {
        return new AgendaCitaItemResponse(
                cita.getId(),
                cita.getFecha(),
                cita.getHoraInicio(),
                cita.getHoraFin(),
                cita.getEstado(),
                cita.getMotivo(),
                cita.getPaciente().getId(),
                cita.getPaciente().getNombre(),
                cita.getPaciente().getDocumento(),
                cita.getServicio().getNombre(),
                cita.getEspacioFisico().getNombre()
        );
    }
}