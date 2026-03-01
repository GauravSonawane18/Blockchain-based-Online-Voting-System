package com.major.evoting_system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "voter_eligibility", uniqueConstraints = @UniqueConstraint(columnNames = {"voter_id", "election_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoterEligibility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voter_id", nullable = false)
    private User voter;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "election_id", nullable = false)
    private Election election;

    @Builder.Default
    private boolean isEligible = true;
}