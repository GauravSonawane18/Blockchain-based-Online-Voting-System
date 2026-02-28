package com.major.evoting_system.repository;
import com.major.evoting_system.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CandidateRepository extends JpaRepository<Candidate,Long> {
    List<Candidate> findByElectionId(Long electionId);
    long countByElectionId(Long electionId);
}
