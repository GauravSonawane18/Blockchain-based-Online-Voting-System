package com.major.evoting_system.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="elections") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Election {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String title;
    @Column(columnDefinition="TEXT") private String description;
    private String contractAddress;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    @Enumerated(EnumType.STRING) @Builder.Default private ElectionStatus status = ElectionStatus.PENDING;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="created_by") private User createdBy;
    @Column(updatable=false) @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
    public enum ElectionStatus { PENDING, ACTIVE, ENDED }
}
