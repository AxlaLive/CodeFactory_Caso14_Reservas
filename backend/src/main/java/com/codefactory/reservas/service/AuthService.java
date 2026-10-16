package com.codefactory.reservas.service;

import com.codefactory.reservas.dto.AuthResponse;
import com.codefactory.reservas.dto.LoginRequest;
import com.codefactory.reservas.Security.JwtService;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService) {

        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        String username = authentication.getName();
        String token = jwtService.generateToken(username);
        String authority = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_PROFESSIONAL");
        String role = authority.replaceFirst("^ROLE_", "").toLowerCase();

        return new AuthResponse(
                token,
                username,
                role
        );
    }
}