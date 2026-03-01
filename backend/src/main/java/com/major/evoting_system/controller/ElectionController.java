package com.major.evoting_system.controller;

import com.major.evoting_system.model.Election;
import com.major.evoting_system.model.User;
import com.major.evoting_system.model.VoterEligibility;
import com.major.evoting_system.repository.UserRepository;
import com.major.evoting_system.repository.VoterEligibilityRepository;
import com.major.evoting_system.service.ElectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/elections")
@RequiredArgsConstructor
@Slf4j
public class ElectionController {

    private final ElectionService electionService;
    private final UserRepository userRepo;
    private final VoterEligibilityRepository eligibilityRepo;

    @GetMapping
    public ResponseEntity<List<Election>> all() {
        return ResponseEntity.ok(electionService.getAllElections());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Election>> active() {
        return ResponseEntity.ok(electionService.getActiveElections());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Election> one(@PathVariable Long id) {
        return ResponseEntity.ok(electionService.getElectionById(id));
    }

    @GetMapping("/my-elections")
    public ResponseEntity<List<VoterEligibility>> mine(Authentication auth) {
        User voter = userRepo.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(eligibilityRepo.findByVoterId(voter.getId()));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            User admin = userRepo.findByEmail(auth.getName()).orElseThrow();

            String title = (String) body.get("title");
            String description = (String) body.getOrDefault("description", "");
            String startTimeStr = (String) body.get("startTime");
            String endTimeStr = (String) body.get("endTime");

            if (title == null || title.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Title is required"));
            }
            if (startTimeStr == null || endTimeStr == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Start and end times are required"));
            }

            // Parse datetime - handle multiple formats
            LocalDateTime startTime = parseDateTime(startTimeStr);
            LocalDateTime endTime = parseDateTime(endTimeStr);

            log.info("Creating election: title={}, start={}, end={}", title, startTime, endTime);

            Election election = Election.builder()
                    .title(title.trim())
                    .description(description)
                    .startTime(startTime)
                    .endTime(endTime)
                    .build();

            Election saved = electionService.createElection(election, admin);

            // Return a simple map to avoid lazy loading issues with createdBy
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("title", saved.getTitle());
            response.put("description", saved.getDescription());
            response.put("status", saved.getStatus().name());
            response.put("startTime", saved.getStartTime() != null ? saved.getStartTime().toString() : null);
            response.put("endTime", saved.getEndTime() != null ? saved.getEndTime().toString() : null);
            response.put("createdAt", saved.getCreatedAt() != null ? saved.getCreatedAt().toString() : null);
            response.put("contractAddress", saved.getContractAddress());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (DateTimeParseException e) {
            log.error("DateTime parse error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Invalid date format. Use: 2026-03-01T06:00:00"
            ));
        } catch (Exception e) {
            log.error("Error creating election: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to create election: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<?> start(@PathVariable Long id, Authentication auth) {
        try {
            User admin = userRepo.findByEmail(auth.getName()).orElseThrow();
            electionService.startElection(id, admin.getId());
            return ResponseEntity.ok(Map.of("message", "Election started"));
        } catch (Exception e) {
            log.error("Error starting election {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to start election: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<?> end(@PathVariable Long id, Authentication auth) {
        try {
            User admin = userRepo.findByEmail(auth.getName()).orElseThrow();
            electionService.endElection(id, admin.getId());
            return ResponseEntity.ok(Map.of("message", "Election ended"));
        } catch (Exception e) {
            log.error("Error ending election {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to end election: " + e.getMessage()));
        }
    }

    /**
     * Parse datetime string handling multiple formats:
     * - "2026-03-01T06:00:00" (ISO with seconds)
     * - "2026-03-01T06:00"    (ISO without seconds)
     * - "2026-03-01 06:00:00" (space separator)
     */
    private LocalDateTime parseDateTime(String s) {
        if (s == null || s.trim().isEmpty()) {
            throw new DateTimeParseException("Empty datetime string", s, 0);
        }
        s = s.trim();

        // Try standard ISO format first
        try {
            return LocalDateTime.parse(s);
        } catch (DateTimeParseException e1) {
            // Try without seconds
            try {
                return LocalDateTime.parse(s, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
            } catch (DateTimeParseException e2) {
                // Try with space separator
                try {
                    return LocalDateTime.parse(s, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                } catch (DateTimeParseException e3) {
                    // Try with space and no seconds
                    return LocalDateTime.parse(s, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
                }
            }
        }
    }
}