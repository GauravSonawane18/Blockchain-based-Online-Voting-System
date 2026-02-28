package com.major.evoting_system.model;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="voter_eligibility",uniqueConstraints=@UniqueConstraint(columnNames={"voter_id","election_id"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class VoterEligibility {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="voter_id",nullable=false) private User voter;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="election_id",nullable=false) private Election election;
    @Builder.Default private boolean isEligible = true;
}
