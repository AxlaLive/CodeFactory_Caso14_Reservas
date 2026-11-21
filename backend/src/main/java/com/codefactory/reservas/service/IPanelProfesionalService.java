package com.codefactory.reservas.service;

import com.codefactory.reservas.dto.AgendaCitaItemResponse;
import java.time.LocalDate;
import java.util.List;

public interface IPanelProfesionalService {
    List<AgendaCitaItemResponse> obtenerMiAgenda(LocalDate fechaInicio, LocalDate fechaFin);
}