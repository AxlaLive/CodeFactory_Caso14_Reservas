package com.codefactory.reservas.service;

public interface IAuditoriaService {
    void registrarEvento(String usuarioActor, String rolActor, Long pacienteId,
                         Long historiaClinicaId, String accion, String detalle);
}