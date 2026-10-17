package com.codefactory.reservas;

import com.codefactory.reservas.repository.ClienteRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Map;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RegistroClienteApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired ClienteRepository clientes;
    @Autowired PasswordEncoder encoder;

    @Test
    void registraAutenticaYRechazaDuplicados() throws Exception {
        String id = UUID.randomUUID().toString();
        String correo = id + "@example.com";
        String body = mapper.writeValueAsString(Map.of("nombre", "Ana Pérez", "documento", id,
                "correo", correo.toUpperCase(), "telefono", "3001234567", "password", "Clave12345"));
        String response = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(jsonPath("role").value("ROLE_CLIENTE"))
                .andExpect(jsonPath("username").value(correo)).andExpect(jsonPath("passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        var cliente = clientes.findByCorreo(correo).orElseThrow();
        assertThat(encoder.matches("Clave12345", cliente.getPasswordHash())).isTrue();
        String token = mapper.readTree(response).get("token").asText();
        mvc.perform(get("/api/servicios").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
        mvc.perform(get("/api/pacientes").header("Authorization", "Bearer " + token)).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(
                mapper.writeValueAsString(Map.of("username", correo, "password", "Clave12345"))))
                .andExpect(status().isOk()).andExpect(jsonPath("role").value("ROLE_CLIENTE"));
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void rechazaCamposFaltantesEInvalidos() throws Exception {
        long before = clientes.count();
        for (String body : new String[]{"{}", "{\"nombre\":\" \",\"correo\":\"incorrecto\",\"password\":\"123\"}"}) {
            mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("error").value("VALIDATION_ERROR"));
        }
        assertThat(clientes.count()).isEqualTo(before);
    }
}
