package com.major.evoting_system.controller;
import com.major.evoting_system.dto.VoteDTOs.*;
import com.major.evoting_system.model.User;
import com.major.evoting_system.repository.UserRepository;
import com.major.evoting_system.service.VoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/votes") @RequiredArgsConstructor
public class VoteController {
    private final VoteService voteService;
    private final UserRepository userRepo;
    @PostMapping("/request-otp") public ResponseEntity<?> requestOtp(@RequestBody OtpRequest req,Authentication auth) {
        User voter=voter(auth); voteService.generateOtpForVoting(voter.getId(),req.getElectionId());
        return ResponseEntity.ok(Map.of("message","OTP sent to "+mask(voter.getEmail()),"expiresInMinutes",5));
    }
    @PostMapping("/verify-otp") public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest req,Authentication auth) {
        User voter=voter(auth); String nullifier=voteService.verifyOtpAndGetNullifier(voter.getId(),req.getElectionId(),req.getOtpCode());
        return ResponseEntity.ok(Map.of("nullifierHash",nullifier,"message","OTP verified. Cast vote via MetaMask."));
    }
    @PostMapping("/save-receipt") public ResponseEntity<VoteReceiptResponse> saveReceipt(@RequestBody Map<String,String> b,Authentication auth) {
        User voter=voter(auth);
        return ResponseEntity.ok(voteService.saveVoteReceipt(voter.getId(),Long.parseLong(b.get("electionId")),Long.parseLong(b.get("candidateId")),b.get("transactionHash"),b.get("nullifierHash")));
    }
    @GetMapping("/status/{electionId}") public ResponseEntity<?> status(@PathVariable Long electionId,Authentication auth) {
        return ResponseEntity.ok(Map.of("hasVoted",voteService.hasVoted(voter(auth).getId(),electionId)));
    }
    private User voter(Authentication auth) { return userRepo.findByEmail(auth.getName()).orElseThrow(); }
    private String mask(String e) { int at=e.indexOf('@'); return at<=2?e:e.charAt(0)+"***"+e.substring(at); }
}
