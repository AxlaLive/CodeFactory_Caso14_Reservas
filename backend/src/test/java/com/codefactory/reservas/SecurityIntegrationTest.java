package com.codefactory.reservas;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Debe autenticar correctamente con credenciales válidas")
    void testLoginExitoso() throws Exception {
        String loginJson = "{\"username\":\"admin@dentia.com\",\"password\":\"dentia123\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    @DisplayName("Debe rechazar el acceso con credenciales inválidas")
    void testLoginFallido() throws Exception {
        String loginJson = "{\"username\":\"admin@dentia.com\",\"password\":\"clave_incorrecta\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Debe denegar el acceso a rutas protegidas sin token")
    void testRutaProtegidaSinToken() throws Exception {
        mockMvc.perform(get("/api/profesionales"))
                .andExpect(status().isForbidden());
    }
}