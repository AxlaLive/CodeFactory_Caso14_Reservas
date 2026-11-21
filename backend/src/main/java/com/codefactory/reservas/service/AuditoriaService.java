package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.AuditoriaAcceso;
import com.codefactory.reservas.repository.AuditoriaAccesoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditoriaService implements IAuditoriaService {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaService.class);
    private final AuditoriaAccesoRepository auditoriaRepository;

    public AuditoriaService(AuditoriaAccesoRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    // REQUIRES_NEW asegura que el log de auditoría se guarde incluso si se lanza una excepción 403 después
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarEvento(String usuarioActor, String rolActor, Long pacienteId,
                                Long historiaClinicaId, String accion, String detalle) {
        AuditoriaAcceso registro = new AuditoriaAcceso(
                usuarioActor, rolActor, pacienteId, historiaClinicaId, accion, detalle);
        auditoriaRepository.save(registro);

        log.info("AUDIT_TRAIL | Usuario: {} | Rol: {} | Accion: {} | PacienteID: {} | HistoriaID: {} | Detalle: {}",
                usuarioActor, rolActor, accion, pacienteId, historiaClinicaId, detalle);
    }
}