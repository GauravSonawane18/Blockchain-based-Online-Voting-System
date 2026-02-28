package com.major.evoting_system.model;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="candidates") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Candidate {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="election_id",nullable=false) private Election election;
    @Column(nullable=false) private String name;
    private String party;
    private String description;
    private String photoUrl;
    private Long candidateIdOnChain;
}
