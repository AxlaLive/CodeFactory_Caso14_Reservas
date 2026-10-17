package com.codefactory.reservas.service;

import com.codefactory.reservas.dto.AuthResponse;
import com.codefactory.reservas.dto.LoginRequest;
import com.codefactory.reservas.Security.JwtService;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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

        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        String token = jwtService.generateToken(authentication.getName());

        return new AuthResponse(
                token,
                authentication.getName(),
                authentication.getAuthorities().iterator().next().getAuthority()
        );
    }
}
