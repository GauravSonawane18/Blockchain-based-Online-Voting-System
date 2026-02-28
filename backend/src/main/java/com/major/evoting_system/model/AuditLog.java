package com.major.evoting_system.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="audit_logs") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String action;
    private Long userId;
    private String ipAddress;
    private String transactionHash;
    @Column(columnDefinition="TEXT") private String details;
    @Column(updatable=false) @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
