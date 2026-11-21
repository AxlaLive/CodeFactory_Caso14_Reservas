package com.codefactory.reservas.service;

import com.codefactory.reservas.Security.JwtService;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.dto.AuthResponse;
import com.codefactory.reservas.dto.LoginRequest;
import com.codefactory.reservas.repository.ProfesionalRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final ProfesionalRepository profesionalRepository;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            ProfesionalRepository profesionalRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.profesionalRepository = profesionalRepository;
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        String authority = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "El usuario autenticado no tiene un rol asignado."));
        String role = authority.startsWith("ROLE_PROFESSIONAL")
                || authority.startsWith("ROLE_RECEPTIONIST")
                ? authority.substring("ROLE_".length()).toLowerCase(Locale.ROOT)
                : authority;
        String username = authentication.getName();
        String token = jwtService.generateToken(username, authority);

        if (authority.equals("ROLE_PROFESSIONAL") || authority.equals("ROLE_RECEPTIONIST")) {
            Profesional profesional = profesionalRepository.findByUsuarioIgnoreCase(username)
                    .orElseThrow(() -> new IllegalStateException(
                            "No fue posible cargar los datos de la cuenta autenticada."));
            String name = (profesional.getNombre() + " " + profesional.getApellido()).trim();
            return new AuthResponse(
                    token,
                    username,
                    role,
                    profesional.getId(),
                    name,
                    profesional.getEspecialidad());
        }

        return new AuthResponse(token, username, role);
    }
}
