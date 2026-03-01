package com.major.evoting_system.controller;

import com.major.evoting_system.model.*;
import com.major.evoting_system.repository.*;
import com.major.evoting_system.service.ElectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
@Slf4j
public class ResultController {

    private final ElectionService electionService;
    private final CandidateRepository candidateRepo;
    private final VoteRepository voteRepo;

    /**
     * Get results for an election from the database.
     * Shows live vote counts (updating as votes come in).
     */
    @GetMapping("/{electionId}")
    public ResponseEntity<?> getResults(@PathVariable Long electionId) {
        Election election = electionService.getElectionById(electionId);
        List<Candidate> candidates = candidateRepo.findByElectionId(electionId);

        List<Map<String, Object>> results = new ArrayList<>();
        long totalVotes = 0;

        for (Candidate c : candidates) {
            long votes = voteRepo.countByElectionIdAndCandidateId(electionId, c.getId());
            totalVotes += votes;
            Map<String, Object> entry = new HashMap<>();
            entry.put("candidateId", c.getId());
            entry.put("name",        c.getName());
            entry.put("party",       c.getParty() != null ? c.getParty() : "");
            entry.put("description", c.getDescription() != null ? c.getDescription() : "");
            entry.put("voteCount",   votes);
            results.add(entry);
        }

        // Add percentages
        final long total = totalVotes;
        results.forEach(r -> {
            long votes = (long) r.get("voteCount");
            double pct = total > 0 ? (votes * 100.0 / total) : 0.0;
            r.put("percentage", Math.round(pct * 10.0) / 10.0);
        });

        // Sort by vote count descending
        results.sort((a, b) -> Long.compare((long) b.get("voteCount"), (long) a.get("voteCount")));

        return ResponseEntity.ok(Map.of(
            "electionId",    electionId,
            "electionTitle", election.getTitle(),
            "status",        election.getStatus().name(),
            "totalVotes",    totalVotes,
            "candidates",    results
        ));
    }
}