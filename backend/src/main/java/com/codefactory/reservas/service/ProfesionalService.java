package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.DisponibilidadRepository;
import com.codefactory.reservas.repository.HistoriaClinicaRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProfesionalService {

    private final ProfesionalRepository profesionalRepository;
    private final CitaRepository citaRepository;
    private final DisponibilidadRepository disponibilidadRepository;
    private final HistoriaClinicaRepository historiaClinicaRepository;

    public ProfesionalService(
            ProfesionalRepository profesionalRepository,
            CitaRepository citaRepository,
            DisponibilidadRepository disponibilidadRepository,
            HistoriaClinicaRepository historiaClinicaRepository) {
        this.profesionalRepository = profesionalRepository;
        this.citaRepository = citaRepository;
        this.disponibilidadRepository = disponibilidadRepository;
        this.historiaClinicaRepository = historiaClinicaRepository;
    }

    public List<Profesional> obtenerTodos() {
        return profesionalRepository.findAll();
    }

    public Optional<Profesional> obtenerPorId(Long id) {
        return profesionalRepository.findById(id);
    }

    public Profesional guardar(Profesional profesional) {
        return profesionalRepository.save(profesional);
    }

    public Profesional actualizar(Long id, Profesional detalles) {
        return profesionalRepository.findById(id).map(profesional -> {
            profesional.setNombre(detalles.getNombre());
            profesional.setApellido(detalles.getApellido());
            profesional.setDocumento(detalles.getDocumento());
            profesional.setEspecialidad(detalles.getEspecialidad());
            profesional.setCorreo(detalles.getCorreo());
            profesional.setActivo(detalles.getActivo());
            return profesionalRepository.save(profesional);
        }).orElseThrow(() -> new RuntimeException("Profesional no encontrado con id: " + id));
    }

    @Transactional
    public boolean eliminar(Long id) {
        Profesional profesional = profesionalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Profesional no encontrado con id: " + id));
        boolean tieneReferencias = citaRepository.existsByProfesionalId(id)
                || disponibilidadRepository.existsByProfesionalId(id)
                || historiaClinicaRepository.existsByProfesionalId(id);
        if (tieneReferencias) {
            profesional.setActivo(false);
            profesionalRepository.save(profesional);
            return false;
        }
        profesionalRepository.delete(profesional);
        return true;
    }
}