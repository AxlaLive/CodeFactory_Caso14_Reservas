package com.codefactory.reservas.Security;

import com.codefactory.reservas.repository.ProfesionalRepository;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
        public UserDetailsService userDetailsService(
            PasswordEncoder passwordEncoder,
            ProfesionalRepository profesionalRepository
        ) {
        UserDetails admin = User.builder()
            .username("admin")
            .password(passwordEncoder.encode("dentia123"))
            .roles("ADMIN")
            .build();

        return username -> {
            if ("admin".equalsIgnoreCase(username)) {
            return admin;
            }
            return profesionalRepository.findByUsuarioIgnoreCaseOrCorreoIgnoreCase(username, username)
                .filter(profesional -> Boolean.TRUE.equals(profesional.getActivo()))
                .filter(profesional -> profesional.getPasswordHash() != null)
                .map(profesional -> User.withUsername(profesional.getUsuario())
                    .password(profesional.getPasswordHash())
                    .roles(profesional.getRol())
                    .build())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado."));
        };
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

@Bean
public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {

    http
            .csrf(csrf -> csrf.disable())

            .cors(cors -> {})

            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/trabajadores/**").permitAll()
                    .requestMatchers("/api/v1/trabajadores/**").hasRole("ADMIN")
                    .requestMatchers("/h2-console/**").permitAll()
                    .anyRequest().authenticated()
            )

            .headers(headers ->
                    headers.frameOptions(frame -> frame.sameOrigin())
            )

            .addFilterBefore(
                    jwtAuthenticationFilter,
                    UsernamePasswordAuthenticationFilter.class
            );

    return http.build();
}

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Accept", "Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}