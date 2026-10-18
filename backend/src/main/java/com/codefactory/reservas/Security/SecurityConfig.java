package com.codefactory.reservas.Security;

import com.codefactory.reservas.domain.Cliente;
import com.codefactory.reservas.domain.Profesional;
import com.codefactory.reservas.repository.ClienteRepository;
import com.codefactory.reservas.repository.ProfesionalRepository;
import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public UserDetailsService customUserDetailsService(
            PasswordEncoder passwordEncoder,
            ProfesionalRepository profesionalRepository,
            ClienteRepository clienteRepository) {
        UserDetails admin = User.withUsername("admin")
                .password(passwordEncoder.encode("dentia123"))
                .roles("ADMIN")
                .build();

        return username -> {
            if (username == null || username.isBlank()) {
                throw new UsernameNotFoundException("Usuario no especificado.");
            }
            if ("admin".equalsIgnoreCase(username)) {
                return admin;
            }

            String normalizedUsername = username.strip();
            Profesional profesional = profesionalRepository
                    .findByUsuarioIgnoreCaseOrCorreoIgnoreCase(normalizedUsername, normalizedUsername)
                    .or(() -> profesionalRepository.findByDocumento(normalizedUsername))
                    .orElse(null);
            if (profesional != null) {
                if (profesional.getPasswordHash() == null || profesional.getPasswordHash().isBlank()) {
                    throw new UsernameNotFoundException("El trabajador no tiene una cuenta de acceso.");
                }
                return User.withUsername(profesional.getUsuario())
                        .password(profesional.getPasswordHash())
                        .roles(profesional.getRol())
                        .disabled(!Boolean.TRUE.equals(profesional.getActivo()))
                        .build();
            }

            String normalizedEmail = normalizedUsername.toLowerCase(Locale.ROOT);
            Cliente cliente = clienteRepository.findByCorreoIgnoreCase(normalizedEmail)
                    .or(() -> clienteRepository.findByDocumento(normalizedUsername))
                    .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado."));
            return User.withUsername(cliente.getCorreo())
                    .password(cliente.getPasswordHash())
                    .roles("CLIENTE")
                    .disabled(!cliente.getPaciente().isActivo())
                    .build();
        };
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/h2-console/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/servicios", "/api/servicios/**")
                        .hasAnyRole("ADMIN", "PROFESSIONAL", "RECEPTIONIST", "CLIENTE")
                        .requestMatchers(HttpMethod.POST, "/api/servicios")
                        .hasAnyRole("ADMIN", "RECEPTIONIST")
                        .requestMatchers(HttpMethod.GET,
                                "/api/citas/rango",
                                "/api/disponibilidades", "/api/disponibilidades/**",
                                "/api/pacientes", "/api/pacientes/**",
                                "/api/espacios", "/api/v1/profesionales", "/api/v1/profesionales/**",
                                "/api/v1/pacientes/*/historia-clinica")
                        .hasAnyRole("ADMIN", "PROFESSIONAL", "RECEPTIONIST")
                        .requestMatchers(HttpMethod.POST, "/api/v1/pacientes/*/historia-clinica")
                        .hasRole("PROFESSIONAL")
                        .requestMatchers(HttpMethod.POST, "/api/citas")
                        .hasAnyRole("ADMIN", "RECEPTIONIST")
                        .requestMatchers(HttpMethod.PUT, "/api/citas/**")
                        .hasAnyRole("ADMIN", "RECEPTIONIST")
                        .requestMatchers(HttpMethod.PATCH, "/api/citas/*/cancelar")
                        .hasAnyRole("ADMIN", "RECEPTIONIST")
                        .requestMatchers(HttpMethod.POST, "/api/disponibilidades")
                        .hasAnyRole("ADMIN", "PROFESSIONAL")
                        .requestMatchers(HttpMethod.PUT, "/api/disponibilidades/**")
                        .hasAnyRole("ADMIN", "PROFESSIONAL")
                        .requestMatchers(HttpMethod.DELETE, "/api/disponibilidades/**")
                        .hasAnyRole("ADMIN", "PROFESSIONAL")
                        .requestMatchers(HttpMethod.POST, "/api/pacientes")
                        .hasAnyRole("ADMIN", "PROFESSIONAL", "RECEPTIONIST")
                        .requestMatchers(HttpMethod.PUT, "/api/pacientes/**")
                        .hasAnyRole("ADMIN", "PROFESSIONAL", "RECEPTIONIST")
                        .anyRequest().hasRole("ADMIN"))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${cors.allowed-origin-patterns}") String allowedOriginPatterns) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Accept", "Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
