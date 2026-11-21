package com.codefactory.reservas.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class PacientePerfilResponse {

    private Long id;
    private String nombre;
    private String documento;
    private boolean activo;
    private List<CitaResumenResponse> proximasCitas;
    private List<HistorialCitaResponse> historialClinico;

    public PacientePerfilResponse() {
    }

    public PacientePerfilResponse(Long id, String nombre, String documento, boolean activo,
                                  List<CitaResumenResponse> proximasCitas,
                                  List<HistorialCitaResponse> historialClinico) {
        this.id = id;
        this.nombre = nombre;
        this.documento = documento;
        this.activo = activo;
        this.proximasCitas = proximasCitas;
        this.historialClinico = historialClinico;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDocumento() {
        return documento;
    }

    public void setDocumento(String documento) {
        this.documento = documento;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public List<CitaResumenResponse> getProximasCitas() {
        return proximasCitas;
    }

    public void setProximasCitas(List<CitaResumenResponse> proximasCitas) {
        this.proximasCitas = proximasCitas;
    }

    public List<HistorialCitaResponse> getHistorialClinico() {
        return historialClinico;
    }

    public void setHistorialClinico(List<HistorialCitaResponse> historialClinico) {
        this.historialClinico = historialClinico;
    }

    public static class CitaResumenResponse {
        private Long id;
        private LocalDate fecha;
        private LocalTime horaInicio;
        private LocalTime horaFin;
        private String motivo;
        private String estado;
        private String servicioNombre;
        private String profesionalNombre;
        private String espacioNombre;

        public CitaResumenResponse() {
        }

        public CitaResumenResponse(Long id, LocalDate fecha, LocalTime horaInicio, LocalTime horaFin,
                                   String motivo, String estado, String servicioNombre,
                                   String profesionalNombre, String espacioNombre) {
            this.id = id;
            this.fecha = fecha;
            this.horaInicio = horaInicio;
            this.horaFin = horaFin;
            this.motivo = motivo;
            this.estado = estado;
            this.servicioNombre = servicioNombre;
            this.profesionalNombre = profesionalNombre;
            this.espacioNombre = espacioNombre;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public LocalDate getFecha() {
            return fecha;
        }

        public void setFecha(LocalDate fecha) {
            this.fecha = fecha;
        }

        public LocalTime getHoraInicio() {
            return horaInicio;
        }

        public void setHoraInicio(LocalTime horaInicio) {
            this.horaInicio = horaInicio;
        }

        public LocalTime getHoraFin() {
            return horaFin;
        }

        public void setHoraFin(LocalTime horaFin) {
            this.horaFin = horaFin;
        }

        public String getMotivo() {
            return motivo;
        }

        public void setMotivo(String motivo) {
            this.motivo = motivo;
        }

        public String getEstado() {
            return estado;
        }

        public void setEstado(String estado) {
            this.estado = estado;
        }

        public String getServicioNombre() {
            return servicioNombre;
        }

        public void setServicioNombre(String servicioNombre) {
            this.servicioNombre = servicioNombre;
        }

        public String getProfesionalNombre() {
            return profesionalNombre;
        }

        public void setProfesionalNombre(String profesionalNombre) {
            this.profesionalNombre = profesionalNombre;
        }

        public String getEspacioNombre() {
            return espacioNombre;
        }

        public void setEspacioNombre(String espacioNombre) {
            this.espacioNombre = espacioNombre;
        }
    }

    public static class HistorialCitaResponse {
        private Long citaId;
        private LocalDate fecha;
        private LocalTime horaInicio;
        private LocalTime horaFin;
        private String estado;
        private String motivoConsulta;
        private String servicioNombre;
        private String profesionalNombre;
        private String especialidadProfesional;

        public HistorialCitaResponse() {
        }

        public HistorialCitaResponse(Long citaId, LocalDate fecha, LocalTime horaInicio, LocalTime horaFin,
                                     String estado, String motivoConsulta, String servicioNombre,
                                     String profesionalNombre, String especialidadProfesional) {
            this.citaId = citaId;
            this.fecha = fecha;
            this.horaInicio = horaInicio;
            this.horaFin = horaFin;
            this.estado = estado;
            this.motivoConsulta = motivoConsulta;
            this.servicioNombre = servicioNombre;
            this.profesionalNombre = profesionalNombre;
            this.especialidadProfesional = especialidadProfesional;
        }

        public Long getCitaId() {
            return citaId;
        }

        public void setCitaId(Long citaId) {
            this.citaId = citaId;
        }

        public LocalDate getFecha() {
            return fecha;
        }

        public void setFecha(LocalDate fecha) {
            this.fecha = fecha;
        }

        public LocalTime getHoraInicio() {
            return horaInicio;
        }

        public void setHoraInicio(LocalTime horaInicio) {
            this.horaInicio = horaInicio;
        }

        public LocalTime getHoraFin() {
            return horaFin;
        }

        public void setHoraFin(LocalTime horaFin) {
            this.horaFin = horaFin;
        }

        public String getEstado() {
            return estado;
        }

        public void setEstado(String estado) {
            this.estado = estado;
        }

        public String getMotivoConsulta() {
            return motivoConsulta;
        }

        public void setMotivoConsulta(String motivoConsulta) {
            this.motivoConsulta = motivoConsulta;
        }

        public String getServicioNombre() {
            return servicioNombre;
        }

        public void setServicioNombre(String servicioNombre) {
            this.servicioNombre = servicioNombre;
        }

        public String getProfesionalNombre() {
            return profesionalNombre;
        }

        public void setProfesionalNombre(String profesionalNombre) {
            this.profesionalNombre = profesionalNombre;
        }

        public String getEspecialidadProfesional() {
            return especialidadProfesional;
        }

        public void setEspecialidadProfesional(String especialidadProfesional) {
            this.especialidadProfesional = especialidadProfesional;
        }
    }
}