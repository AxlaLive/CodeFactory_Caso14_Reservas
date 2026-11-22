package com.codefactory.reservas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.CommandLineRunner;
import com.codefactory.reservas.repository.ProfesionalRepository;

@SpringBootApplication
public class ReservasBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReservasBackendApplication.class, args);
    }
    @Bean
    @Profile("!prod")
    public CommandLineRunner initData(ProfesionalRepository profesionalRepository) {
        return args -> {
            if (profesionalRepository.findByCorreo("admin@dentia.com").isEmpty()) {
                var encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
                var admin = com.codefactory.reservas.domain.Profesional.builder()
                        .nombre("Admin")
                        .apellido("Sistema")
                        .documento("000000000")
                        .especialidad("Administración")
                        .correo("admin@dentia.com")
                        .rol("ADMIN")
                        .usuario("admin")
                        .passwordHash(encoder.encode("dentia123"))
                        .activo(true)
                        .build();
                profesionalRepository.save(admin);
            }
        };
    }
}
