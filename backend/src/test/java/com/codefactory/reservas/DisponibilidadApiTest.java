package com.codefactory.reservas;

import com.codefactory.reservas.Security.JwtService;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.repository.ProfesionalRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DisponibilidadApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProfesionalRepository profesionalRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private Profesional profesional;
    private String token;

    @BeforeEach
    void setUp() {
        profesional = profesionalRepository.save(Profesional.builder()
                .nombre("Ana")
                .apellido("Pérez")
                .documento("20000001")
                .especialidad("Odontología")
                .correo("ana.perez@example.com")
                .activo(true)
                .build());
        token = jwtService.generateToken("admin");
    }

    @Test
    void shouldCreateQueryUpdateAndDeleteAvailabilityImmediately() throws Exception {
        String request = """
                {
                  "profesionalId": %d,
                  "fecha": "2026-10-12",
                  "horaInicio": "08:00:00",
                  "horaFin": "12:00:00",
                  "tipo": "AVAILABLE",
                  "motivo": "Atención"
                }
                """.formatted(profesional.getId());

        String response = mockMvc.perform(post("/api/disponibilidades")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("AVAILABLE"))
                .andReturn().getResponse().getContentAsString();

        long id = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/disponibilidades")
                        .header("Authorization", "Bearer " + token)
                        .param("profesionalId", profesional.getId().toString())
                        .param("inicio", "2026-10-12")
                        .param("fin", "2026-10-18"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].horaInicio").value("08:00:00"));

        mockMvc.perform(put("/api/disponibilidades/{id}", id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request.replace("08:00:00", "09:00:00")
                                .replace("12:00:00", "13:00:00")
                                .replace("AVAILABLE", "BREAK")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("BREAK"))
                .andExpect(jsonPath("$.horaInicio").value("09:00:00"));

        mockMvc.perform(get("/api/disponibilidades/{id}", id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("BREAK"));

        mockMvc.perform(delete("/api/disponibilidades/{id}", id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/disponibilidades")
                        .header("Authorization", "Bearer " + token)
                        .param("profesionalId", profesional.getId().toString())
                        .param("inicio", "2026-10-12")
                        .param("fin", "2026-10-18"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }
}
