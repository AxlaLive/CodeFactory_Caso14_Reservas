package com.codefactory.reservas.service;

import com.codefactory.reservas.Security.JwtService;
import com.codefactory.reservas.domain.Cliente;
import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.dto.AuthResponse;
import com.codefactory.reservas.dto.RegistroClienteRequest;
import com.codefactory.reservas.exception.BusinessConflictException;
import com.codefactory.reservas.exception.ValidationException;
import com.codefactory.reservas.repository.ClienteRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class RegistroClienteService {
    private final ClienteRepository clientes;
    private final PacienteRepository pacientes;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public RegistroClienteService(ClienteRepository clientes, PacienteRepository pacientes,
                                  PasswordEncoder encoder, JwtService jwt) {
        this.clientes = clientes;
        this.pacientes = pacientes;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse registrar(RegistroClienteRequest request) {
        String correo = request.correo().strip().toLowerCase(Locale.ROOT);
        String documento = request.documento().strip();
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ValidationException("La contraseña admite hasta 72 bytes UTF-8");
        }
        if (clientes.existsByCorreoOrDocumento(correo, documento)
                || pacientes.findByDocumento(documento).isPresent()) {
            throw new BusinessConflictException("El correo o documento ya está registrado");
        }
        Paciente paciente = new Paciente(null, request.nombre().strip(), documento, true);
        paciente.setCorreo(correo);
        paciente.setTelefono(request.telefono().strip());
        Cliente cliente = new Cliente();
        cliente.setCorreo(correo);
        cliente.setDocumento(documento);
        cliente.setPasswordHash(encoder.encode(request.password()));
        try {
            cliente.setPaciente(pacientes.save(paciente));
            clientes.saveAndFlush(cliente);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessConflictException("El correo o documento ya está registrado");
        }
        return new AuthResponse(jwt.generateToken(correo), correo, "ROLE_CLIENTE");
    }
}
