package com.codefactory.reservas.dto;

import com.codefactory.reservas.domain.Cita;

import java.time.LocalDate;
import java.time.LocalTime;

public record CitaResponse(
        Long id,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        ProfesionalResponse profesional,
        EspacioFisicoResponse espacioFisico,
        PacienteResponse paciente,
        ServicioResponse servicio,
        String motivo,
        String estado
) {
    public static CitaResponse from(Cita cita) {
        return new CitaResponse(
                cita.getId(),
                cita.getFecha(),
                cita.getHoraInicio(),
                cita.getHoraFin(),
                new ProfesionalResponse(
                        cita.getProfesional().getId(),
                        cita.getProfesional().getNombre(),
                        cita.getProfesional().getApellido(),
                        cita.getProfesional().getEspecialidad()
                ),
                new EspacioFisicoResponse(
                        cita.getEspacioFisico().getId(),
                        cita.getEspacioFisico().getNombre()
                ),
                new PacienteResponse(
                        cita.getPaciente().getId(),
                        cita.getPaciente().getNombre(),
                        cita.getPaciente().getDocumento(),
                        cita.getPaciente().getTelefono(),
                        cita.getPaciente().getCorreo()
                ),
                new ServicioResponse(
                        cita.getServicio().getId(),
                        cita.getServicio().getNombre(),
                        cita.getServicio().getDuracionMinutos()
                ),
                cita.getMotivo(),
                cita.getEstado()
        );
    }

    public record ProfesionalResponse(Long id, String nombre, String apellido, String especialidad) {}

    public record EspacioFisicoResponse(Long id, String nombre) {}

    public record PacienteResponse(Long id, String nombre, String documento, String telefono, String correo) {}

    public record ServicioResponse(Long id, String nombre, int duracionMinutos) {}
}
