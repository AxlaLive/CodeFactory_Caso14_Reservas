package com.codefactory.reservas.service;

import com.codefactory.reservas.domain.Paciente;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Comparator;
import java.util.regex.Pattern;

@Component
public class ClinicalSummarySanitizer {

    private static final String MASK = "[DATO IDENTIFICATIVO]";
    private static final Pattern EMAIL = Pattern.compile(
            "(?i)\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b");
    private static final Pattern LONG_NUMBER = Pattern.compile(
            "(?<!\\d)(?:\\+?\\d[\\s().-]*){7,15}(?!\\d)");
    private static final Pattern LABELED_IDENTIFIER = Pattern.compile(
            "(?i)\\b(documento|identificaci[oó]n|tel[eé]fono|celular|correo)\\s*[:=]\\s*[^,;\\n]+");
    private static final Pattern LABELED_ADDRESS = Pattern.compile(
            "(?i)\\b(direcci[oó]n|domicilio|address)\\s*[:=]\\s*[^,;\\n]+");

    public String sanitize(String text, Paciente patient) {
        String sanitized = text == null ? "" : text;
        String[] directIdentifiers = {
                patient.getNombre(),
                patient.getDocumento(),
                patient.getCorreo(),
                patient.getTelefono()
        };
        for (String identifier : Arrays.stream(directIdentifiers)
                .filter(value -> value != null && !value.isBlank())
                .sorted(Comparator.comparingInt(String::length).reversed())
                .toList()) {
            sanitized = Pattern.compile(
                            Pattern.quote(identifier), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)
                    .matcher(sanitized)
                    .replaceAll(MASK);
        }
        sanitized = LABELED_IDENTIFIER.matcher(sanitized).replaceAll("$1: " + MASK);
        sanitized = LABELED_ADDRESS.matcher(sanitized).replaceAll("$1: " + MASK);
        sanitized = EMAIL.matcher(sanitized).replaceAll(MASK);
        return LONG_NUMBER.matcher(sanitized).replaceAll(MASK);
    }

}
