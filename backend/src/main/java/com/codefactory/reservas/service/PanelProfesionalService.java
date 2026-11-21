// PanelProfesionalService.java
package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.dto.AgendaCitaItemResponse;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class PanelProfesionalService implements IPanelProfesionalService {

    private final CitaRepository citaRepository;
    private final ProfesionalRepository profesionalRepository;

    public PanelProfesionalService(CitaRepository citaRepository, ProfesionalRepository profesionalRepository) {
        this.citaRepository = citaRepository;
        this.profesionalRepository = profesionalRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AgendaCitaItemResponse> obtenerMiAgenda(LocalDate fechaInicio, LocalDate fechaFin) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Profesional profesional = profesionalRepository
                .findByUsuarioIgnoreCaseOrCorreoIgnoreCase(username, username)
                .or(() -> profesionalRepository.findByDocumento(username))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Perfil de profesional no encontrado para el usuario autenticado."));

        LocalDate inicio = (fechaInicio != null) ? fechaInicio : LocalDate.now();
        LocalDate fin = (fechaFin != null) ? fechaFin : inicio;

        return citaRepository
                .findByProfesionalIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(profesional.getId(), inicio, fin)
                .stream()
                .map(AgendaCitaItemResponse::from)
                .toList();
    }
}