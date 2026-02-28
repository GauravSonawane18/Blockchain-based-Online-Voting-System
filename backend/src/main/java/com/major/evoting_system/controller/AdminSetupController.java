package com.major.evoting_system.controller;

import com.major.evoting_system.model.User;
import com.major.evoting_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/setup")
@RequiredArgsConstructor
public class AdminSetupController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * ONE-TIME endpoint to create or reset the admin user.
     * Call: POST http://localhost:8080/setup/admin
     * Body: { "secret": "SETUP_SECRET_2025", "password": "YourNewPassword" }
     *
     * DELETE THIS FILE after admin is created.
     */
    @PostMapping("/admin")
    public ResponseEntity<?> createAdmin(@RequestBody Map<String, String> body) {

        String secret = body.get("secret");
        if (!"SETUP_SECRET_2025".equals(secret)) {
            return ResponseEntity.status(403).body(Map.of("error", "Invalid secret"));
        }

        String rawPassword = body.getOrDefault("password", "Admin@123");
        String email = body.getOrDefault("email", "admin@evoting.com");

        // Delete existing if any
        userRepository.findByEmail(email).ifPresent(userRepository::delete);

        // Create fresh admin with Spring's own BCryptPasswordEncoder
        User admin = User.builder()
                .fullName("System Admin")
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(User.Role.ADMIN)
                .verificationStatus(User.VerificationStatus.VERIFIED)
                .isActive(true)
                .is2faEnabled(false)
                .voterId("ADMIN-001")
                .createdAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(admin);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Admin created. Login with: " + email + " / " + rawPassword,
                "id", saved.getId(),
                "email", saved.getEmail(),
                "role", saved.getRole().toString(),
                "verificationStatus", saved.getVerificationStatus().toString(),
                "isActive", saved.isActive(),
                "passwordHashPrefix", saved.getPassword().substring(0, 10)
        ));
    }
}