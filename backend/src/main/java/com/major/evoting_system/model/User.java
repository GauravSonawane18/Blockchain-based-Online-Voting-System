package com.major.evoting_system.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="users") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String fullName;
    @Column(nullable=false,unique=true) private String email;
    @Column(nullable=false) private String password;
    @Column(unique=true) private String walletAddress;
    @Enumerated(EnumType.STRING) @Column(nullable=false) @Builder.Default private Role role = Role.VOTER;
    @Enumerated(EnumType.STRING) @Builder.Default private VerificationStatus verificationStatus = VerificationStatus.PENDING;
    private String idDocumentUrl;
    private String voterId;
    private String totpSecret;
    @Builder.Default private boolean is2faEnabled = false;
    @Builder.Default private boolean isActive = false;
    @Column(updatable=false) @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
    public enum Role { VOTER, ADMIN }
    public enum VerificationStatus { PENDING, VERIFIED, REJECTED }
}
