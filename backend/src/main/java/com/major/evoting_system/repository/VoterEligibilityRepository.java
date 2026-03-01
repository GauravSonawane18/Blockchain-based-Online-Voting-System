package com.major.evoting_system.repository;

import com.major.evoting_system.model.VoterEligibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VoterEligibilityRepository extends JpaRepository<VoterEligibility, Long> {

    List<VoterEligibility> findByVoterId(Long voterId);

    List<VoterEligibility> findByElectionId(Long electionId);

    boolean existsByVoterIdAndElectionIdAndIsEligibleTrue(Long voterId, Long electionId);

    boolean existsByVoterIdAndElectionId(Long voterId, Long electionId);
}