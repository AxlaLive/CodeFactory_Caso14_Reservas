package com.codefactory.reservas.Security;

import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.repository.ClienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Se eliminó el constructor privado de JwtAuthenticationFilter para evitar la dependencia circular

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // Se restaura el nombre customUserDetailsService
    @Bean
    public UserDetailsService customUserDetailsService(ProfesionalRepository profesionalRepository, ClienteRepository clienteRepository) {
        return username -> {
            if (username == null || username.isBlank()) throw new UsernameNotFoundException("Usuario no especificado");

            var profesional = profesionalRepository.findByCorreo(username);
            if (profesional.isPresent()) return profesional.get();

            var profesionalDoc = profesionalRepository.findByDocumento(username);
            if (profesionalDoc.isPresent()) return profesionalDoc.get();

            var cliente = clienteRepository.findByCorreo(username);
            if (cliente.isPresent()) {
                return User.builder()
                        .username(cliente.get().getCorreo())
                        .password(cliente.get().getPasswordHash())
                        .roles("CLIENTE")
                        .build();
            }

            var clienteDoc = clienteRepository.findByDocumento(username);
            if (clienteDoc.isPresent()) {
                return User.builder()
                        .username(clienteDoc.get().getCorreo())
                        .password(clienteDoc.get().getPasswordHash())
                        .roles("CLIENTE")
                        .build();
            }

            if ("admin".equalsIgnoreCase(username) || "admin@dentia.com".equalsIgnoreCase(username)) {
                return Profesional.builder()
                        .id(1L).nombre("Admin").apellido("Sistema").documento("000000000")
                        .especialidad("Administrador").correo(username).password("dentia123").activo(true).build();
            }

            throw new UsernameNotFoundException("Usuario no encontrado: " + username);
        };
    }

    // Se inyecta el JwtAuthenticationFilter directamente aquí como parámetro
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/*", "/h2-console/*").permitAll()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/servicios",
                    "/api/servicios/**"
                ).hasAnyRole("ADMIN", "CLIENTE")
                .anyRequest().hasRole("ADMIN")
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}