package com.major.evoting_system.repository;
import com.major.evoting_system.model.VoterEligibility;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface VoterEligibilityRepository extends JpaRepository<VoterEligibility,Long> {
    Optional<VoterEligibility> findByVoterIdAndElectionId(Long voterId, Long electionId);
    List<VoterEligibility> findByVoterId(Long voterId);
    List<VoterEligibility> findByElectionId(Long electionId);
    boolean existsByVoterIdAndElectionIdAndIsEligibleTrue(Long voterId, Long electionId);
}
