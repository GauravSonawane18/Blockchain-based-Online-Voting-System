package com.major.evoting_system.controller;
import com.major.evoting_system.model.*;
import com.major.evoting_system.repository.UserRepository;
import com.major.evoting_system.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/candidates") @RequiredArgsConstructor
public class CandidateController {
    private final CandidateService candidateService;
    private final UserRepository userRepo;
    @GetMapping("/election/{id}") public ResponseEntity<List<Candidate>> list(@PathVariable Long id) { return ResponseEntity.ok(candidateService.getCandidatesByElection(id)); }
    @PostMapping public ResponseEntity<Candidate> add(@RequestBody Map<String,Object> body,Authentication auth) throws Exception {
        User admin=userRepo.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.addCandidate(Long.parseLong(body.get("electionId").toString()),(String)body.get("name"),(String)body.get("party"),(String)body.get("description"),admin.getId()));
    }
}
