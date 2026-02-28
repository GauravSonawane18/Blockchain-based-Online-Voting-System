package com.major.evoting_system.controller;
import com.major.evoting_system.model.User;
import com.major.evoting_system.repository.UserRepository;
import com.major.evoting_system.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/admin") @RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;
    private final UserRepository userRepo;
    @GetMapping("/pending-voters") public ResponseEntity<List<User>> pending() {
        List<User> v=adminService.getPendingVoters(); v.forEach(u->{u.setPassword(null);u.setTotpSecret(null);}); return ResponseEntity.ok(v);
    }
    @PostMapping("/approve-voter/{id}") public ResponseEntity<?> approve(@PathVariable Long id,Authentication auth) throws Exception {
        adminService.approveVoter(id,userRepo.findByEmail(auth.getName()).orElseThrow().getId()); return ResponseEntity.ok(Map.of("message","Voter approved"));
    }
    @PostMapping("/reject-voter/{id}") public ResponseEntity<?> reject(@PathVariable Long id,@RequestBody Map<String,String> body,Authentication auth) {
        adminService.rejectVoter(id,body.get("reason"),userRepo.findByEmail(auth.getName()).orElseThrow().getId()); return ResponseEntity.ok(Map.of("message","Voter rejected"));
    }
    @PostMapping("/assign-voter") public ResponseEntity<?> assign(@RequestBody Map<String,Long> body,Authentication auth) {
        adminService.assignVoterToElection(body.get("voterId"),body.get("electionId"),userRepo.findByEmail(auth.getName()).orElseThrow().getId()); return ResponseEntity.ok(Map.of("message","Voter assigned"));
    }
    @GetMapping("/stats") public ResponseEntity<?> stats() {
        return ResponseEntity.ok(Map.of("totalVoters",adminService.getTotalVoters(),"pendingCount",adminService.getPendingVerificationCount()));
    }
}
