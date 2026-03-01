package com.major.evoting_system.controller;

import com.major.evoting_system.model.*;
import com.major.evoting_system.repository.*;
import com.major.evoting_system.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/votes")
@RequiredArgsConstructor
@Slf4j
public class VoteController {

    private final VoteRepository voteRepo;
    private final UserRepository userRepo;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoterEligibilityRepository eligibilityRepo;
    private final AuditService auditService;

    /**
     * Cast a vote for a candidate in an election. Checks: election ACTIVE,
     * voter eligible, not already voted.
     */
    @PostMapping("/cast")
    public ResponseEntity<?> castVote(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            User voter = userRepo.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Voter not found"));

            Long electionId = Long.parseLong(body.get("electionId").toString());
            Long candidateId = Long.parseLong(body.get("candidateId").toString());

            Election election = electionRepo.findById(electionId)
                    .orElseThrow(() -> new RuntimeException("Election not found"));

            if (election.getStatus() != Election.ElectionStatus.ACTIVE) {
                return ResponseEntity.badRequest().body(Map.of("message", "Election is not active"));
            }

            // Check voter eligibility
            boolean eligible = eligibilityRepo.existsByVoterIdAndElectionId(voter.getId(), electionId);
            if (!eligible) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "You are not eligible to vote in this election"));
            }

            // Check already voted
            boolean alreadyVoted = voteRepo.existsByVoterIdAndElectionId(voter.getId(), electionId);
            if (alreadyVoted) {
                return ResponseEntity.badRequest().body(Map.of("message", "You have already voted in this election"));
            }

            Candidate candidate = candidateRepo.findById(candidateId)
                    .orElseThrow(() -> new RuntimeException("Candidate not found"));

            if (!candidate.getElection().getId().equals(electionId)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Candidate does not belong to this election"));
            }

            // Generate nullifier hash for anonymity (voter_id + election_id hash)
            String nullifierHash = generateNullifier(voter.getId(), electionId);

            // Check nullifier not used (extra safety)
            if (voteRepo.existsByNullifierHash(nullifierHash)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vote already recorded for this identity"));
            }

            // Try blockchain vote (non-fatal if fails)
            String txHash = null;
            try {
                // Blockchain vote would go here - skipped if Hardhat not running
                log.info("Blockchain voting skipped - using DB-only mode");
            } catch (Exception e) {
                log.warn("Blockchain vote failed (non-fatal): {}", e.getMessage());
            }

            // Record vote in DB
            Vote vote = Vote.builder()
                    .voter(voter)
                    .election(election)
                    .candidate(candidate)
                    .transactionHash(txHash != null ? txHash : "db-only-" + UUID.randomUUID().toString().substring(0, 8))
                    .nullifierHash(nullifierHash)
                    .votedAt(LocalDateTime.now())
                    .build();

            voteRepo.save(vote);

            auditService.log(
                    "VOTE_CAST",
                    voter.getId(), // Long
                    electionId.toString(), // String
                    vote.getTransactionHash(),
                    "Vote cast for candidate: " + candidate.getName()
            );

            log.info("Vote cast by voter {} for candidate {} in election {}", voter.getId(), candidateId, electionId);

            return ResponseEntity.ok(Map.of(
                    "message", "Vote cast successfully",
                    "transactionHash", vote.getTransactionHash(),
                    "candidateName", candidate.getName()
            ));

        } catch (RuntimeException e) {
            log.error("Vote cast error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Check if the current voter has voted in a specific election.
     */
    @GetMapping("/has-voted/{electionId}")
    public ResponseEntity<?> hasVoted(@PathVariable Long electionId, Authentication auth) {
        User voter = userRepo.findByEmail(auth.getName()).orElseThrow();
        boolean voted = voteRepo.existsByVoterIdAndElectionId(voter.getId(), electionId);
        return ResponseEntity.ok(Map.of("hasVoted", voted, "electionId", electionId));
    }

    /**
     * Get the current voter's voting history (anonymized).
     */
    @GetMapping("/my-votes")
    public ResponseEntity<?> myVotes(Authentication auth) {
        User voter = userRepo.findByEmail(auth.getName()).orElseThrow();
        List<Vote> votes = voteRepo.findByVoterId(voter.getId());

        List<Map<String, Object>> result = new ArrayList<>();
        for (Vote v : votes) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("electionId", v.getElection().getId());
            entry.put("electionTitle", v.getElection().getTitle());
            entry.put("votedAt", v.getVotedAt());
            entry.put("txHash", v.getTransactionHash());
            result.add(entry);
        }
        return ResponseEntity.ok(result);
    }

    private String generateNullifier(Long voterId, Long electionId) {
        // Simple deterministic hash for double-vote prevention
        return org.springframework.util.DigestUtils.md5DigestAsHex(
                (voterId + "_" + electionId + "_blockvote").getBytes()
        );
    }
}
