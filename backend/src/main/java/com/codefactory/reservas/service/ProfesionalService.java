package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.repository.ProfesionalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProfesionalService {

    @Autowired
    private ProfesionalRepository profesionalRepository;

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

    public void eliminar(Long id) {
        profesionalRepository.deleteById(id);
    }
}