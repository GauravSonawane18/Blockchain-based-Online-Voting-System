package com.major.evoting_system.config;
import com.major.evoting_system.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
@Configuration @EnableWebSecurity @EnableMethodSecurity @RequiredArgsConstructor
public class SecurityConfig {
    private final JwtFilter jwtFilter;
    @Bean public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a->a
                    .requestMatchers("/setup/**").permitAll()
                .requestMatchers("/api/auth/register","/api/auth/login","/api/auth/verify-2fa","/h2-console/**").permitAll()
                .requestMatchers("/api/admin/**","/api/audit/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .headers(h->h.frameOptions(f->f.disable()))
            .addFilterBefore(jwtFilter,UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean public AuthenticationManager authenticationManager(AuthenticationConfiguration c) throws Exception { return c.getAuthenticationManager(); }
}
