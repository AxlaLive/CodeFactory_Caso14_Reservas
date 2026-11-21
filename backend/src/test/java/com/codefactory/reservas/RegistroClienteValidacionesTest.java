package com.codefactory.reservas;

import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.repository.ClienteRepository;
import com.codefactory.reservas.repository.PacienteRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RegistroClienteValidacionesTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired ClienteRepository clientes;
    @Autowired PacienteRepository pacientes;

    private Map<String, String> valido() {
        String id = UUID.randomUUID().toString();
        return new HashMap<>(Map.of("nombre", "Ana Pérez", "documento", id,
                "correo", id + "@example.com", "telefono", "3001234567", "password", "Clave12345"));
    }

    static Stream<Arguments> obligatorios() {
        return Stream.of("nombre", "documento", "correo", "telefono", "password")
                .flatMap(campo -> Stream.of("ausente", "nulo", "vacío", "espacios")
                        .map(tipo -> Arguments.of(campo, tipo)));
    }

    @ParameterizedTest(name = "{0}: {1}")
    @MethodSource("obligatorios")
    void rechazaCadaCampoObligatorio(String campo, String tipo) throws Exception {
        var body = valido();
        switch (tipo) {
            case "ausente" -> body.remove(campo);
            case "nulo" -> body.put(campo, null);
            case "vacío" -> body.put(campo, "");
            default -> body.put(campo, "   ");
        }
        rechazaSinGuardar(body);
    }

    static Stream<Arguments> invalidos() {
        return Stream.of(
                Arguments.of("correo", "sin-arroba"),
                Arguments.of("correo", "a".repeat(140) + "@example.com"),
                Arguments.of("nombre", "a".repeat(256)),
                Arguments.of("documento", "1".repeat(256)),
                Arguments.of("telefono", "abcdefghi"),
                Arguments.of("telefono", "123456"),
                Arguments.of("telefono", "1".repeat(31)),
                Arguments.of("password", "1234567"),
                Arguments.of("password", "a".repeat(73)),
                Arguments.of("password", "á".repeat(37)));
    }

    @ParameterizedTest(name = "Formato o longitud inválida: {0} [{index}]")
    @MethodSource("invalidos")
    void rechazaFormatosYLongitudes(String campo, String valor) throws Exception {
        var body = valido();
        body.put(campo, valor);
        rechazaSinGuardar(body);
    }

    private void rechazaSinGuardar(Map<String, String> body) throws Exception {
        long cuentas = clientes.count();
        long registros = pacientes.count();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("message").isNotEmpty())
                .andExpect(jsonPath("token").doesNotExist());
        assertThat(clientes.count()).isEqualTo(cuentas);
        assertThat(pacientes.count()).isEqualTo(registros);
    }

    @Test
    void aceptaLimitesDePasswordYNormalizaDatos() throws Exception {
        for (String password : new String[]{"12345678", "a".repeat(72), "á".repeat(36)}) {
            var body = valido();
            body.put("nombre", "  Ana Pérez  ");
            body.put("documento", " " + body.get("documento") + " ");
            body.put("correo", body.get("correo").toUpperCase(java.util.Locale.ROOT));
            body.put("password", password);
            mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(body)))
                    .andExpect(status().isCreated()).andExpect(jsonPath("token").isNotEmpty());
            var cliente = clientes.findByCorreo(body.get("correo").toLowerCase(java.util.Locale.ROOT)).orElseThrow();
            assertThat(cliente.getPaciente().getNombre()).isEqualTo("Ana Pérez");
            assertThat(cliente.getDocumento()).isEqualTo(body.get("documento").strip());
        }
    }

    @ParameterizedTest
    @org.junit.jupiter.params.provider.ValueSource(strings = {"correo", "documento"})
    void rechazaDuplicadosIndependientesSinCrearPaciente(String campo) throws Exception {
        var primero = valido();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(primero))).andExpect(status().isCreated());
        var segundo = valido();
        segundo.put(campo, campo.equals("correo") ? primero.get(campo).toUpperCase(java.util.Locale.ROOT) : primero.get(campo));
        long cuentas = clientes.count();
        long registros = pacientes.count();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(segundo)))
                .andExpect(status().isConflict()).andExpect(jsonPath("error").value("CONFLICT"));
        assertThat(clientes.count()).isEqualTo(cuentas);
        assertThat(pacientes.count()).isEqualTo(registros);
    }

    @Test
    void noVinculaUnaCuentaPublicaAUnPacienteExistente() throws Exception {
        var body = valido();
        Paciente existente = pacientes.saveAndFlush(new Paciente(null, "Paciente existente", body.get("documento"), true));
        long cuentas = clientes.count();
        long registros = pacientes.count();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(body)))
                .andExpect(status().isConflict());
        assertThat(clientes.count()).isEqualTo(cuentas);
        assertThat(pacientes.count()).isEqualTo(registros);
        assertThat(pacientes.findById(existente.getId()).orElseThrow().getNombre()).isEqualTo("Paciente existente");
    }
}
