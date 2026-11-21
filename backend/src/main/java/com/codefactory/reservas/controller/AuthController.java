package com.codefactory.reservas.controller;

import com.codefactory.reservas.dto.AuthResponse;
import com.codefactory.reservas.dto.LoginRequest;
import com.codefactory.reservas.dto.RegistroClienteRequest;
import com.codefactory.reservas.service.AuthService;
import com.codefactory.reservas.service.RegistroClienteService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RegistroClienteService registroService;

    public AuthController(AuthService authService, RegistroClienteService registroService) {
        this.registroService = registroService;
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registrar(
            @Valid @RequestBody RegistroClienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registroService.registrar(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        AuthResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }
}
