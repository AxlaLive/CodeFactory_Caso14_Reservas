package com.codefactory.reservas.dto;

public class AuthResponse {

    private String token;
    private String username;
    private String role;
    private Long id;
    private String name;
    private String specialty;

    public AuthResponse(String token, String username, String role) {
        this(token, username, role, null, null, null);
    }

    public AuthResponse(
            String token,
            String username,
            String role,
            Long id,
            String name,
            String specialty) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.id = id;
        this.name = name;
        this.specialty = specialty;
    }

    public String getToken() {
        return token;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSpecialty() {
        return specialty;
    }
}