package com.major.evoting_system.repository;
import com.major.evoting_system.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface VoteRepository extends JpaRepository<Vote,Long> {
    boolean existsByVoterIdAndElectionId(Long voterId, Long electionId);
    Optional<Vote> findByTransactionHash(String txHash);
    List<Vote> findByElectionId(Long electionId);
    long countByElectionId(Long electionId);
}
