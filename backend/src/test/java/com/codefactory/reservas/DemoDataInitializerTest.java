package com.codefactory.reservas;

import com.codefactory.reservas.config.DemoDataInitializer;
import com.codefactory.reservas.domain.Cita;
import com.codefactory.reservas.domain.Cliente;
import com.codefactory.reservas.domain.EspacioFisico;
import com.codefactory.reservas.domain.HistoriaClinica;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.domain.Servicio;
import com.codefactory.reservas.repository.CitaRepository;
import com.codefactory.reservas.repository.ClienteRepository;
import com.codefactory.reservas.repository.EspacioFisicoRepository;
import com.codefactory.reservas.repository.HistoriaClinicaRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import com.codefactory.reservas.repository.ServicioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DemoDataInitializerTest {

    @Test
    void createsSeventyFictionalPatientsAndTheirClinicalHistories() throws Exception {
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        PacienteRepository patientRepository = mock(PacienteRepository.class);
        ClienteRepository clientRepository = mock(ClienteRepository.class);
        ProfesionalRepository professionalRepository = mock(ProfesionalRepository.class);
        EspacioFisicoRepository spaceRepository = mock(EspacioFisicoRepository.class);
        ServicioRepository serviceRepository = mock(ServicioRepository.class);
        CitaRepository appointmentRepository = mock(CitaRepository.class);
        HistoriaClinicaRepository historyRepository = mock(HistoriaClinicaRepository.class);

        when(passwordEncoder.encode("Demo-password-01")).thenReturn("encoded-demo-password");
        when(professionalRepository.findAll()).thenReturn(List.of());
        when(professionalRepository.save(any(Profesional.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(spaceRepository.findAll()).thenReturn(List.of());
        when(spaceRepository.save(any(EspacioFisico.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(serviceRepository.findAll()).thenReturn(List.of());
        when(serviceRepository.save(any(Servicio.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(patientRepository.findByDocumento(any())).thenReturn(Optional.empty());
        AtomicLong nextPatientId = new AtomicLong();
        when(patientRepository.save(any(Paciente.class))).thenAnswer(invocation -> {
            Paciente patient = invocation.getArgument(0);
            patient.setId(nextPatientId.incrementAndGet());
            return patient;
        });
        when(clientRepository.findByCorreoIgnoreCase(any())).thenReturn(Optional.empty());
        when(clientRepository.findByDocumento(any())).thenReturn(Optional.empty());
        when(clientRepository.save(any(Cliente.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(historyRepository.findByPacienteIdOrderByCreadoEnDesc(any())).thenReturn(List.of());
        when(appointmentRepository.save(any(Cita.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(historyRepository.save(any(HistoriaClinica.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        DemoDataInitializer initializer = new DemoDataInitializer(
                "Demo-password-01",
                passwordEncoder,
                patientRepository,
                clientRepository,
                professionalRepository,
                spaceRepository,
                serviceRepository,
                appointmentRepository,
                historyRepository);
        initializer.run(new DefaultApplicationArguments(new String[0]));

        verify(patientRepository, times(70)).save(any(Paciente.class));
        verify(clientRepository, times(70)).save(any(Cliente.class));
        verify(appointmentRepository, times(126)).save(any(Cita.class));
        verify(historyRepository, times(126)).save(any(HistoriaClinica.class));
        assertEquals(70, nextPatientId.get());
    }
}
