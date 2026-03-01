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
public class CandidateService {

    private final CandidateRepository candidateRepo;
    private final ElectionRepository electionRepo;
    private final BlockchainService blockchainService;

    public List<Candidate> getCandidatesByElection(Long electionId) {
        return candidateRepo.findByElectionId(electionId);
    }

    @Transactional
    public Candidate addCandidate(Long electionId, String name, String party, String desc, Long adminId) {
        Election election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ResourceNotFoundException("Election not found"));

        if (election.getStatus() == Election.ElectionStatus.ENDED) {
            throw new ElectionException("Cannot add candidates to an ended election");
        }

        // Calculate chain ID based on existing candidates
        long chainId = candidateRepo.countByElectionId(electionId) + 1;

        // Only push to blockchain if election is already ACTIVE
        // For PENDING elections, we register candidates on-chain when election starts
        if (election.getStatus() == Election.ElectionStatus.ACTIVE) {
            try {
                blockchainService.addCandidateOnChain(name, party != null ? party : "");
                log.info("Candidate {} added to blockchain for active election {}", name, electionId);
            } catch (Exception e) {
                log.warn("Blockchain addCandidate failed (non-fatal): {}", e.getMessage());
                // Don't fail - save to DB anyway so admin can retry blockchain later
            }
        } else {
            log.info("Election {} is PENDING - candidate {} saved to DB only (will sync to blockchain on start)", electionId, name);
        }

        Candidate candidate = Candidate.builder()
                .election(election)
                .name(name)
                .party(party)
                .description(desc)
                .candidateIdOnChain(chainId)
                .build();

        return candidateRepo.save(candidate);
    }
}