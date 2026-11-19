package com.codefactory.reservas;

import com.codefactory.reservas.domain.Paciente;
import com.codefactory.reservas.service.AzureOpenAiClinicalSummaryGenerator;
import com.codefactory.reservas.service.ClinicalSummarySanitizer;
import com.codefactory.reservas.service.GroqClinicalSummaryGenerator;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClinicalSummarySanitizerTest {

    private final ClinicalSummarySanitizer sanitizer = new ClinicalSummarySanitizer();

    @Test
    void masksPatientIdentifiersAndContactDetails() {
        Paciente patient = new Paciente(null, "Andrea Paciente Demo", "DEMO-1234567", true);
        patient.setCorreo("andrea@example.invalid");
        patient.setTelefono("3001234567");

        String sanitized = sanitizer.sanitize(
                "Andrea Paciente Demo, documento DEMO-1234567, correo andrea@example.invalid, "
                        + "teléfono 3001234567, dirección: Calle 10 # 2-30.",
                patient);

        assertFalse(sanitized.contains("Andrea Paciente Demo"));
        assertFalse(sanitized.contains("DEMO-1234567"));
        assertFalse(sanitized.contains("andrea@example.invalid"));
        assertFalse(sanitized.contains("3001234567"));
        assertFalse(sanitized.contains("Calle 10 # 2-30"));
        assertTrue(sanitized.contains("[DATO IDENTIFICATIVO]"));
    }

    @Test
    void reportsMissingAzureConfigurationInsteadOfFabricatingASummary() {
        AzureOpenAiClinicalSummaryGenerator generator =
                new AzureOpenAiClinicalSummaryGenerator("", "", "", "2024-10-21");

        ResponseStatusException exception = org.junit.jupiter.api.Assertions.assertThrows(
                ResponseStatusException.class,
                () -> generator.generate("Datos clínicos desidentificados"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE.value(), exception.getStatusCode().value());
    }

    @Test
    void reportsMissingGroqApiKeyInsteadOfFabricatingASummary() {
        GroqClinicalSummaryGenerator generator =
                new GroqClinicalSummaryGenerator("", "llama-3.3-70b-versatile");

        ResponseStatusException exception = org.junit.jupiter.api.Assertions.assertThrows(
                ResponseStatusException.class,
                () -> generator.generate("Datos clínicos desidentificados"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE.value(), exception.getStatusCode().value());
    }
}
