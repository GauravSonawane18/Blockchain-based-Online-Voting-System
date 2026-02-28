package com.major.evoting_system.service;
import com.major.evoting_system.dto.AuthDTOs.*;
import com.major.evoting_system.exception.*;
import com.major.evoting_system.model.User;
import com.major.evoting_system.repository.UserRepository;
import com.major.evoting_system.security.JwtUtil;
import dev.samstevens.totp.code.*;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class AuthService {
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final UserDetailsService uds;
    private final AuthenticationManager authManager;
    private final AuditService auditService;

    public void registerVoter(RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail()))
            throw new UserAlreadyExistsException("Email already registered");
        if (req.getWalletAddress() != null && !req.getWalletAddress().isBlank()
                && userRepo.existsByWalletAddress(req.getWalletAddress()))
            throw new UserAlreadyExistsException("Wallet already registered");
        userRepo.save(User.builder()
            .fullName(req.getFullName()).email(req.getEmail())
            .password(encoder.encode(req.getPassword()))
            .walletAddress(req.getWalletAddress())
            .role(User.Role.VOTER)
            .verificationStatus(User.VerificationStatus.PENDING)
            .isActive(false).build());
    }

    public AuthResponse login(LoginRequest req) {
        // Step 1: check user exists
        User u = userRepo.findByEmail(req.getEmail())
            .orElseThrow(() -> new InvalidCredentialsException("No account found with this email"));

        // Step 2: check password manually (better error message)
        if (!encoder.matches(req.getPassword(), u.getPassword()))
            throw new InvalidCredentialsException("Incorrect password");

        // Step 3: check verification
        if (u.getVerificationStatus() != User.VerificationStatus.VERIFIED)
            throw new AccountNotVerifiedException(
                "Account not verified. Status: " + u.getVerificationStatus() +
                ". Please wait for admin approval.");

        // Step 4: check active
        if (!u.isActive())
            throw new AccountNotVerifiedException("Account is inactive. Contact admin.");

        // Step 5: 2FA
        if (u.is2faEnabled())
            return AuthResponse.builder().email(u.getEmail()).requires2fa(true).is2faEnabled(true).build();

        log.info("Login success: {}", u.getEmail());
        return buildResponse(u);
    }

    public AuthResponse verifyTwoFactor(TwoFactorRequest req) {
        User u = userRepo.findByEmail(req.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!u.is2faEnabled() || u.getTotpSecret() == null)
            throw new TwoFactorException("2FA not set up");
        if (!verifyTotp(u.getTotpSecret(), req.getTotpCode()))
            throw new TwoFactorException("Invalid 2FA code");
        return buildResponse(u);
    }

    public Setup2FAResponse setupTwoFactor(String email) {
        User u = userRepo.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String secret = new DefaultSecretGenerator().generate();
        u.setTotpSecret(secret); userRepo.save(u);
        return Setup2FAResponse.builder()
            .secret(secret)
            .qrCodeUri("otpauth://totp/EVoting:" + u.getEmail() +
                       "?secret=" + secret + "&issuer=EVotingSystem").build();
    }

    public void confirmTwoFactorSetup(String email, String code) {
        User u = userRepo.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!verifyTotp(u.getTotpSecret(), code))
            throw new TwoFactorException("Invalid code");
        u.set2faEnabled(true); userRepo.save(u);
    }

    public String generateVoterId() {
        return "VTR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private AuthResponse buildResponse(User u) {
        UserDetails ud = uds.loadUserByUsername(u.getEmail());
        return AuthResponse.builder()
            .token(jwtUtil.generateToken(ud, u.getRole().name()))
            .email(u.getEmail()).fullName(u.getFullName())
            .role(u.getRole().name()).voterId(u.getVoterId())
            .requires2fa(false).is2faEnabled(u.is2faEnabled()).build();
    }

    private boolean verifyTotp(String secret, String code) {
        try {
            DefaultCodeVerifier v = new DefaultCodeVerifier(
                new DefaultCodeGenerator(), new SystemTimeProvider());
            v.setAllowedTimePeriodDiscrepancy(1);
            return v.isValidCode(secret, code);
        } catch (Exception e) { return false; }
    }
}
