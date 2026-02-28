package com.major.evoting_system.controller;
import com.major.evoting_system.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/audit") @RequiredArgsConstructor
public class AuditController {
    private final AuditService auditService;
    @GetMapping("/logs") public ResponseEntity<?> logs(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return ResponseEntity.ok(auditService.getAllLogs(page,size)); }
    @GetMapping("/blockchain-txs") public ResponseEntity<?> txs() { return ResponseEntity.ok(auditService.getBlockchainTransactions()); }
    @GetMapping("/user/{userId}") public ResponseEntity<?> userLogs(@PathVariable Long userId) { return ResponseEntity.ok(auditService.getLogsByUser(userId)); }
}
