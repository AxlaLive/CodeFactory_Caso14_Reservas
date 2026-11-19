package com.codefactory.reservas.config;

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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;

@Component
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
public class DemoDataInitializer implements ApplicationRunner {

    private static final int PATIENT_COUNT = 70;
    private static final String DEMO_DOCUMENT_PREFIX = "DEMO-DENTIA-";
    private static final String DEMO_EMAIL_DOMAIN = "@example.invalid";
    private static final List<String> FIRST_NAMES = List.of(
            "Valeria", "Mateo", "Camila", "Samuel", "Isabella",
            "Santiago", "Mariana", "Nicolás", "Lucía", "Tomás");
    private static final List<String> LAST_NAMES = List.of(
            "Ríos", "Cárdenas", "Pardo", "Salazar", "Ocampo", "Vélez", "Restrepo");
    private static final List<String> EVOLUTIONS = List.of(
            "Consulta de control. Se realiza valoración intraoral; paciente tolera adecuadamente la atención.",
            "Refiere sensibilidad breve al frío en sector posterior. Se examina la zona y se registra seguimiento.",
            "Acude para valoración preventiva. Tejidos blandos sin cambios relevantes en el examen de hoy.",
            "Se revisa higiene oral y se documentan hallazgos localizados para control en próxima consulta.",
            "Paciente refiere molestia leve al masticar. Se realiza examen clínico y se deja registro de evolución.",
            "Control posterior a procedimiento restaurador. Sin complicaciones reportadas durante la atención."
    );
    private static final List<String> DIAGNOSES = List.of(
            "Caries dental incipiente en pieza posterior.",
            "Gingivitis marginal leve generalizada.",
            "Restauración existente en buen estado; sin lesión activa en la zona evaluada.",
            "Sensibilidad dentinaria localizada, pendiente de seguimiento clínico.",
            "Acumulación de placa y cálculo supragingival leve.",
            "Control odontológico sin hallazgos patológicos nuevos."
    );
    private static final List<String> TREATMENTS = List.of(
            "Se realiza profilaxis y educación en higiene oral.",
            "Restauración con resina en la pieza afectada, previa valoración clínica.",
            "Se efectúa detartraje supragingival y pulido.",
            "Se aplica barniz de flúor según el plan preventivo.",
            "Se ajusta la restauración existente y se verifica oclusión.",
            "No se realiza procedimiento; se mantiene observación clínica."
    );
    private static final List<String> RECOMMENDATIONS = List.of(
            "Cepillado con crema fluorada dos veces al día y uso diario de seda dental.",
            "Disminuir la frecuencia de alimentos azucarados y asistir al control programado.",
            "Realizar control odontológico en seis meses o antes si aparece dolor persistente.",
            "Evitar masticar alimentos duros en la zona tratada durante el resto del día.",
            "Continuar higiene oral y consultar si aumenta la sensibilidad.",
            "Mantener las medidas preventivas y acudir a la siguiente cita de seguimiento."
    );

    private final String clientPassword;
    private final PasswordEncoder passwordEncoder;
    private final PacienteRepository pacienteRepository;
    private final ClienteRepository clienteRepository;
    private final ProfesionalRepository profesionalRepository;
    private final EspacioFisicoRepository espacioRepository;
    private final ServicioRepository servicioRepository;
    private final CitaRepository citaRepository;
    private final HistoriaClinicaRepository historiaRepository;

    public DemoDataInitializer(
            @Value("${app.demo-data.client-password:}") String clientPassword,
            PasswordEncoder passwordEncoder,
            PacienteRepository pacienteRepository,
            ClienteRepository clienteRepository,
            ProfesionalRepository profesionalRepository,
            EspacioFisicoRepository espacioRepository,
            ServicioRepository servicioRepository,
            CitaRepository citaRepository,
            HistoriaClinicaRepository historiaRepository) {
        this.clientPassword = clientPassword;
        this.passwordEncoder = passwordEncoder;
        this.pacienteRepository = pacienteRepository;
        this.clienteRepository = clienteRepository;
        this.profesionalRepository = profesionalRepository;
        this.espacioRepository = espacioRepository;
        this.servicioRepository = servicioRepository;
        this.citaRepository = citaRepository;
        this.historiaRepository = historiaRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        validatePassword();
        String encodedPassword = passwordEncoder.encode(clientPassword);
        Profesional professional = getOrCreateProfessional(encodedPassword);
        EspacioFisico space = getOrCreateSpace();
        Servicio service = getOrCreateService();

        for (int index = 1; index <= PATIENT_COUNT; index++) {
            seedPatient(index, professional, space, service, encodedPassword);
        }
    }

    private void validatePassword() {
        if (clientPassword == null || clientPassword.isBlank()
                || clientPassword.getBytes(StandardCharsets.UTF_8).length < 8
                || clientPassword.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException(
                    "DEMO_DATA_CLIENT_PASSWORD debe tener entre 8 y 72 bytes UTF-8 si DEMO_DATA_ENABLED=true.");
        }
    }

    private Profesional getOrCreateProfessional(String encodedPassword) {
        return profesionalRepository.findAll().stream()
                .filter(professional -> Boolean.TRUE.equals(professional.getActivo())
                        && "PROFESSIONAL".equalsIgnoreCase(professional.getRol())
                        && professional.getUsuario() != null
                        && !professional.getUsuario().isBlank()
                        && professional.getPasswordHash() != null
                        && !professional.getPasswordHash().isBlank())
                .findFirst()
                .orElseGet(() -> profesionalRepository.save(Profesional.builder()
                        .nombre("Odontólogo")
                        .apellido("Demo Dentia")
                        .documento("DEMO-DENTIA-PROF-001")
                        .especialidad("Odontólogo general")
                        .correo("odontologo.demo" + DEMO_EMAIL_DOMAIN)
                        .usuario("odontologo-demo")
                        .passwordHash(encodedPassword)
                        .rol("PROFESSIONAL")
                        .activo(true)
                        .build()));
    }

    private EspacioFisico getOrCreateSpace() {
        return espacioRepository.findAll().stream()
                .filter(EspacioFisico::isActivo)
                .findFirst()
                .orElseGet(() -> espacioRepository.save(
                        new EspacioFisico(null, "Consultorio DEMO Dentia", "CONSULTORIO", true)));
    }

    private Servicio getOrCreateService() {
        return servicioRepository.findAll().stream()
                .filter(service -> service.getNombre().toLowerCase(Locale.ROOT).contains("odont"))
                .findFirst()
                .orElseGet(() -> servicioRepository.save(
                        new Servicio(null, "Consulta odontológica DEMO", 30)));
    }

    private void seedPatient(
            int index,
            Profesional professional,
            EspacioFisico space,
            Servicio service,
            String encodedPassword) {
        String suffix = String.format(Locale.ROOT, "%04d", index);
        String document = DEMO_DOCUMENT_PREFIX + suffix;
        String email = "paciente.demo." + suffix + DEMO_EMAIL_DOMAIN;
        Paciente patient = pacienteRepository.findByDocumento(document)
                .orElseGet(() -> {
                    Paciente created = new Paciente(
                            null, demoPatientName(index, suffix), document, true);
                    created.setCorreo(email);
                    created.setTelefono("0000000000");
                    return pacienteRepository.save(created);
                });

        if (clienteRepository.findByCorreoIgnoreCase(email).isEmpty()
                && clienteRepository.findByDocumento(document).isEmpty()) {
            Cliente client = new Cliente();
            client.setCorreo(email);
            client.setDocumento(document);
            client.setPaciente(patient);
            client.setPasswordHash(encodedPassword);
            clienteRepository.save(client);
        }

        int desiredHistoryCount = index % 5 == 0 ? 3 : 1 + index % 2;
        int savedHistoryCount = historiaRepository
                .findByPacienteIdOrderByCreadoEnDesc(patient.getId()).size();
        for (int historyIndex = savedHistoryCount; historyIndex < desiredHistoryCount; historyIndex++) {
            LocalDate appointmentDate = LocalDate.now()
                    .minusDays(45L + index * 4L + historyIndex * 120L);
            LocalTime startTime = LocalTime.of(8 + (index % 8), (historyIndex % 2) * 30);
            Cita appointment = citaRepository.save(new Cita(
                    null,
                    appointmentDate,
                    startTime,
                    startTime.plusMinutes(service.getDuracionMinutos()),
                    professional,
                    space,
                    patient,
                    service,
                    "Atención odontológica de demostración",
                    "COMPLETADA"));

            historiaRepository.save(new HistoriaClinica(
                    patient,
                    professional,
                    appointment,
                    select(EVOLUTIONS, index, historyIndex),
                    select(DIAGNOSES, index, historyIndex),
                    select(TREATMENTS, index, historyIndex),
                    select(RECOMMENDATIONS, index, historyIndex)));
        }
    }

    private String select(List<String> examples, int patientIndex, int historyIndex) {
        return examples.get(Math.floorMod(patientIndex + historyIndex * 3, examples.size()));
    }

    private String demoPatientName(int index, String suffix) {
        String firstName = FIRST_NAMES.get((index - 1) % FIRST_NAMES.size());
        String lastName = LAST_NAMES.get((index - 1) / FIRST_NAMES.size());
        return "Paciente DEMO " + firstName + " " + lastName + " " + suffix;
    }
}
