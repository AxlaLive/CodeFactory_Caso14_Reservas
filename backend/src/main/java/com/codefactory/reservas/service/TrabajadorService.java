package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.dto.TrabajadorRequest;
import com.codefactory.reservas.dto.TrabajadorResponse;
import com.codefactory.reservas.exception.BusinessConflictException;
import com.codefactory.reservas.exception.ValidationException;
import com.codefactory.reservas.repository.ClienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.List;
import java.util.Set;

@Service
public class TrabajadorService {

    private static final Set<String> SPECIALTIES = Set.of(
            "Odontólogo general",
            "Endodoncista",
            "Periodoncista",
            "Ortodoncista",
            "Cirujano oral",
            "Odontopediatra"
    );

    private final ProfesionalRepository profesionalRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    public TrabajadorService(
            ProfesionalRepository profesionalRepository,
            ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder) {
        this.profesionalRepository = profesionalRepository;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<TrabajadorResponse> listar() {
        return profesionalRepository.findAllByOrderByNombreAscApellidoAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TrabajadorResponse crear(TrabajadorRequest request) {
        String roleType = request.roleType().trim().toLowerCase(Locale.ROOT);
        if (!roleType.equals("professional") && !roleType.equals("receptionist")) {
            throw new ValidationException("El rol debe ser professional o receptionist.");
        }
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ValidationException("La contraseña admite hasta 72 bytes UTF-8.");
        }

        String specialty = request.specialty() == null ? "" : request.specialty().trim();
        if (roleType.equals("professional") && !SPECIALTIES.contains(specialty)) {
            throw new ValidationException("Selecciona una especialidad válida.");
        }

        String identification = request.identification().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if ("admin".equalsIgnoreCase(username)) {
            throw new BusinessConflictException("El nombre de usuario ya está reservado.");
        }
        if (profesionalRepository.existsByDocumento(identification)) {
            throw new BusinessConflictException("Ya existe un trabajador con esa identificación.");
        }
        if (profesionalRepository.existsByCorreoIgnoreCase(email)
                || clienteRepository.existsByCorreoIgnoreCase(email)) {
            throw new BusinessConflictException("Ya existe un trabajador con ese correo.");
        }
        if (profesionalRepository.existsByUsuarioIgnoreCaseOrCorreoIgnoreCase(username, username)
                || clienteRepository.existsByCorreoIgnoreCase(username)) {
            throw new BusinessConflictException("El nombre de usuario ya está en uso.");
        }

        String[] nameParts = request.name().trim().split("\\s+", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";
        if (firstName.length() > 100 || lastName.length() > 100) {
            throw new ValidationException("El nombre y apellido no pueden superar 100 caracteres cada uno.");
        }

        Profesional profesional = Profesional.builder()
                .nombre(firstName)
                .apellido(lastName)
                .documento(identification)
                .especialidad(roleType.equals("professional") ? specialty : null)
                .correo(email)
                .activo(true)
                .rol(roleType.equals("professional") ? "PROFESSIONAL" : "RECEPTIONIST")
                .usuario(username)
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        return toResponse(profesionalRepository.save(profesional));
    }

    @Transactional
    public TrabajadorResponse actualizarEstado(Long id, Boolean active) {
        Profesional profesional = profesionalRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trabajador no encontrado."));
        profesional.setActivo(active);
        return toResponse(profesionalRepository.save(profesional));
    }

    @Transactional
    public void eliminar(Long id) {
        if (!profesionalRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Trabajador no encontrado.");
        }
        profesionalRepository.deleteById(id);
    }

    private TrabajadorResponse toResponse(Profesional profesional) {
        boolean isProfessional = !"RECEPTIONIST".equalsIgnoreCase(profesional.getRol());
        String specialty = profesional.getEspecialidad() == null ? "" : profesional.getEspecialidad();
        String name = (profesional.getNombre() + " " + profesional.getApellido()).trim();
        return new TrabajadorResponse(
                profesional.getId(),
                name,
                isProfessional ? "professional" : "receptionist",
                isProfessional ? specialty : "Recepcionista",
                specialty,
                profesional.getDocumento(),
                profesional.getCorreo(),
                profesional.getUsuario(),
                profesional.getActivo()
        );
    }
}