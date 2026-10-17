package com.codefactory.reservas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ReservasBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReservasBackendApplication.class, args);
    }
    @org.springframework.context.annotation.Bean
public org.springframework.boot.CommandLineRunner initData(com.codefactory.reservas.repository.ProfesionalRepository profesionalRepository) {
    return args -> {
        if (profesionalRepository.findByCorreo("admin@dentia.com").isEmpty()) {
            // Instanciamos el codificador directamente aquí para no romper los tests
            var encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
            com.codefactory.reservas.domain.Profesional admin = com.codefactory.reservas.domain.Profesional.builder()
                    .nombre("Admin")
                    .apellido("Sistema")
                    .documento("000000000")
                    .especialidad("Administración")
                    .correo("admin@dentia.com")
                    .password(encoder.encode("dentia123"))
                    .activo(true)
                    .build();
            
            profesionalRepository.save(admin);
            System.out.println("✅ Usuario de prueba creado: admin@dentia.com / dentia123");
        }
    };
}
}

