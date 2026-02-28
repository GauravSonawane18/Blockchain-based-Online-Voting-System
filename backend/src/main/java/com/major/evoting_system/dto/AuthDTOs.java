package com.major.evoting_system.dto;
import jakarta.validation.constraints.*;
import lombok.*;
public class AuthDTOs {
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RegisterRequest {
        @NotBlank private String fullName;
        @Email @NotBlank private String email;
        @NotBlank @Size(min=6) private String password;
        private String walletAddress;
    }
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LoginRequest {
        @Email @NotBlank private String email;
        @NotBlank private String password;
    }
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TwoFactorRequest {
        @Email @NotBlank private String email;
        @NotBlank private String totpCode;
    }
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuthResponse {
        private String token,email,fullName,role,voterId;
        private boolean requires2fa,is2faEnabled;
    }
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Setup2FAResponse {
        private String secret,qrCodeUri;
    }
}
