package com.major.evoting_system.repository;

import com.major.evoting_system.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    boolean existsByVoterIdAndElectionId(Long voterId, Long electionId);

    boolean existsByNullifierHash(String nullifierHash);

    List<Vote> findByVoterId(Long voterId);

    List<Vote> findByElectionId(Long electionId);

    @Query("SELECT COUNT(v) FROM Vote v WHERE v.election.id = :electionId AND v.candidate.id = :candidateId")
    long countByElectionIdAndCandidateId(Long electionId, Long candidateId);

    long countByElectionId(Long electionId);
}