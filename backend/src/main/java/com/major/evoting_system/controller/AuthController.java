package com.major.evoting_system.controller;
import com.major.evoting_system.dto.AuthDTOs.*;
import com.major.evoting_system.model.User;
import com.major.evoting_system.repository.UserRepository;
import com.major.evoting_system.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final UserRepository userRepo;
    @PostMapping("/register") public ResponseEntity<?> register(
            @RequestParam String fullName,@RequestParam String email,@RequestParam String password,
            @RequestParam(required=false) String walletAddress,@RequestParam(required=false) MultipartFile idDocument) throws IOException {
        String docUrl=null;
        if(idDocument!=null&&!idDocument.isEmpty()) {
            Files.createDirectories(Paths.get("uploads/")); String fn=System.currentTimeMillis()+"_"+idDocument.getOriginalFilename();
            Files.copy(idDocument.getInputStream(),Paths.get("uploads/"+fn),StandardCopyOption.REPLACE_EXISTING); docUrl="uploads/"+fn;
        }
        authService.registerVoter(RegisterRequest.builder().fullName(fullName).email(email).password(password).walletAddress(walletAddress).build());
        if(docUrl!=null) { final String d=docUrl; userRepo.findByEmail(email).ifPresent(u->{u.setIdDocumentUrl(d);userRepo.save(u);}); }
        return ResponseEntity.ok(Map.of("message","Registration successful. Pending admin verification.","status","PENDING"));
    }
    @PostMapping("/login") public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) { return ResponseEntity.ok(authService.login(req)); }
    @PostMapping("/verify-2fa") public ResponseEntity<AuthResponse> verify2fa(@Valid @RequestBody TwoFactorRequest req) { return ResponseEntity.ok(authService.verifyTwoFactor(req)); }
    @GetMapping("/setup-2fa") public ResponseEntity<Setup2FAResponse> setup2fa(Authentication auth) { return ResponseEntity.ok(authService.setupTwoFactor(auth.getName())); }
    @PostMapping("/confirm-2fa") public ResponseEntity<?> confirm2fa(Authentication auth,@RequestBody Map<String,String> body) {
        authService.confirmTwoFactorSetup(auth.getName(),body.get("code")); return ResponseEntity.ok(Map.of("message","2FA enabled"));
    }
    @GetMapping("/me") public ResponseEntity<User> me(Authentication auth) {
        User u=userRepo.findByEmail(auth.getName()).orElseThrow(); u.setPassword(null); u.setTotpSecret(null); return ResponseEntity.ok(u);
    }
}
