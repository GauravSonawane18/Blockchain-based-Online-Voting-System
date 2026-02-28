package com.major.evoting_system.controller;
import com.major.evoting_system.model.*;
import com.major.evoting_system.repository.*;
import com.major.evoting_system.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
@RestController @RequestMapping("/api/elections") @RequiredArgsConstructor
public class ElectionController {
    private final ElectionService electionService;
    private final UserRepository userRepo;
    private final VoterEligibilityRepository eligibilityRepo;
    @GetMapping public ResponseEntity<List<Election>> all() { return ResponseEntity.ok(electionService.getAllElections()); }
    @GetMapping("/active") public ResponseEntity<List<Election>> active() { return ResponseEntity.ok(electionService.getActiveElections()); }
    @GetMapping("/{id}") public ResponseEntity<Election> one(@PathVariable Long id) { return ResponseEntity.ok(electionService.getElectionById(id)); }
    @GetMapping("/my-elections") public ResponseEntity<List<VoterEligibility>> mine(Authentication auth) {
        return ResponseEntity.ok(eligibilityRepo.findByVoterId(userRepo.findByEmail(auth.getName()).orElseThrow().getId()));
    }
    @PostMapping public ResponseEntity<Election> create(@RequestBody Map<String,Object> body,Authentication auth) {
        User admin=userRepo.findByEmail(auth.getName()).orElseThrow();
        Election e=Election.builder().title((String)body.get("title")).description((String)body.get("description")).startTime(LocalDateTime.parse((String)body.get("startTime"))).endTime(LocalDateTime.parse((String)body.get("endTime"))).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(electionService.createElection(e,admin));
    }
    @PostMapping("/{id}/start") public ResponseEntity<?> start(@PathVariable Long id,Authentication auth) throws Exception {
        electionService.startElection(id,userRepo.findByEmail(auth.getName()).orElseThrow().getId()); return ResponseEntity.ok(Map.of("message","Election started"));
    }
    @PostMapping("/{id}/end") public ResponseEntity<?> end(@PathVariable Long id,Authentication auth) throws Exception {
        electionService.endElection(id,userRepo.findByEmail(auth.getName()).orElseThrow().getId()); return ResponseEntity.ok(Map.of("message","Election ended"));
    }
}
