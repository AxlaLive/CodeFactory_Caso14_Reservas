package com.codefactory.reservas;

import com.codefactory.reservas.Security.JwtService;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.repository.ProfesionalRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TrabajadorApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProfesionalRepository profesionalRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createsWorkersWithRolesAndSpecialtyAndAllowsThemToLogin() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String receptionistUsername = "recep" + suffix;
        String receptionistPassword = "secure123";
        String receptionistRequest = """
                {
                  "name": "María López",
                  "roleType": "receptionist",
                  "specialty": "",
                  "identification": "12345%s",
                  "email": "maria%s@example.com",
                  "username": "%s",
                  "password": "%s"
                }
                """.formatted(suffix.replaceAll("[^0-9]", "0"), suffix, receptionistUsername, receptionistPassword);
        String adminToken = jwtService.generateToken("admin");

        String response = mockMvc.perform(post("/api/v1/trabajadores")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(receptionistRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roleType").value("receptionist"))
                .andExpect(jsonPath("$.role").value("Recepcionista"))
                .andExpect(jsonPath("$.specialty").value(""))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        long workerId = objectMapper.readTree(response).get("id").asLong();
        Profesional receptionist = profesionalRepository.findById(workerId).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(receptionist.getRol()).isEqualTo("RECEPTIONIST");
        org.assertj.core.api.Assertions.assertThat(receptionist.getEspecialidad()).isNull();
        org.assertj.core.api.Assertions.assertThat(receptionist.getPasswordHash()).isNotEqualTo(receptionistPassword);
        org.assertj.core.api.Assertions.assertThat(passwordEncoder.matches(receptionistPassword, receptionist.getPasswordHash())).isTrue();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","password":"%s"}
                                """.formatted(receptionistUsername, receptionistPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("receptionist"))
                .andExpect(jsonPath("$.token").isNotEmpty());

        String professionalRequest = """
                {
                  "name": "Pablo Gómez",
                  "roleType": "professional",
                  "specialty": "Ortodoncista",
                  "identification": "22345%s",
                  "email": "pablo%s@example.com",
                  "username": "prof%s",
                  "password": "secure123"
                }
                """.formatted(suffix.replaceAll("[^0-9]", "0"), suffix, suffix);

        mockMvc.perform(post("/api/v1/trabajadores")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(professionalRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roleType").value("professional"))
                .andExpect(jsonPath("$.specialty").value("Ortodoncista"));

        mockMvc.perform(get("/api/v1/trabajadores"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }
}