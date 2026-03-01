package com.major.evoting_system.service;

import com.major.evoting_system.exception.*;
import com.major.evoting_system.model.*;
import com.major.evoting_system.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ElectionService {

    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final BlockchainService blockchainService;
    private final AuditService auditService;

    public List<Election> getAllElections() {
        return electionRepo.findByOrderByCreatedAtDesc();
    }

    public List<Election> getActiveElections() {
        return electionRepo.findByStatus(Election.ElectionStatus.ACTIVE);
    }

    public Election getElectionById(Long id) {
        return electionRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found"));
    }

    @Transactional
    public Election createElection(Election election, User admin) {
        election.setCreatedBy(admin);
        election.setStatus(Election.ElectionStatus.PENDING);
        Election saved = electionRepo.save(election);
        auditService.log("ELECTION_CREATED", admin.getId(), null, null, "Election: " + election.getTitle());
        return saved;
    }

    @Transactional
    public void startElection(Long id, Long adminId) {
        Election e = getElectionById(id);
        if (e.getStatus() != Election.ElectionStatus.PENDING) {
            throw new ElectionException("Election is not in PENDING state");
        }

        // Register all candidates on blockchain before starting
        List<Candidate> candidates = candidateRepo.findByElectionId(id);
        if (candidates.isEmpty()) {
            throw new ElectionException("Cannot start election with no candidates. Add at least one candidate first.");
        }

        String startTx = null;
        try {
            // First push all pending candidates to blockchain
            for (int i = 0; i < candidates.size(); i++) {
                Candidate c = candidates.get(i);
                try {
                    blockchainService.addCandidateOnChain(
                        c.getName(),
                        c.getParty() != null ? c.getParty() : ""
                    );
                    // Update chain ID based on actual position
                    c.setCandidateIdOnChain((long)(i + 1));
                    candidateRepo.save(c);
                    log.info("Registered candidate {} on blockchain", c.getName());
                } catch (Exception ex) {
                    log.warn("Failed to register candidate {} on blockchain: {}", c.getName(), ex.getMessage());
                }
            }

            // Then start the election on blockchain
            startTx = blockchainService.startElectionOnChain();
            log.info("Election {} started on blockchain, tx: {}", id, startTx);

        } catch (Exception ex) {
            log.warn("Blockchain startElection failed: {} - starting in DB only", ex.getMessage());
            // Allow starting without blockchain for demo/testing purposes
        }

        e.setStatus(Election.ElectionStatus.ACTIVE);
        electionRepo.save(e);
        auditService.log("ELECTION_STARTED", adminId, null, startTx, "Started: " + e.getTitle());
    }

    @Transactional
    public void endElection(Long id, Long adminId) {
        Election e = getElectionById(id);
        if (e.getStatus() != Election.ElectionStatus.ACTIVE) {
            throw new ElectionException("Election is not ACTIVE");
        }

        String endTx = null;
        try {
            endTx = blockchainService.endElectionOnChain();
            log.info("Election {} ended on blockchain, tx: {}", id, endTx);
        } catch (Exception ex) {
            log.warn("Blockchain endElection failed: {} - ending in DB only", ex.getMessage());
        }

        e.setStatus(Election.ElectionStatus.ENDED);
        electionRepo.save(e);
        auditService.log("ELECTION_ENDED", adminId, null, endTx, "Ended: " + e.getTitle());
    }
}