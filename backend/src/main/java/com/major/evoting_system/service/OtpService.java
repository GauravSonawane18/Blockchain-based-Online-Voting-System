package com.major.evoting_system.service;
import com.major.evoting_system.model.*;
import com.major.evoting_system.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.LocalDateTime;
@Service @RequiredArgsConstructor
public class OtpService {
    private final OtpTokenRepository otpRepo;
    private final EmailService emailService;
    @Value("${otp.expiry.minutes:5}") private int expiryMinutes;
    private final SecureRandom rng=new SecureRandom();
    public void generateAndSendOtp(User voter,Election election) {
        String otp=String.format("%06d",rng.nextInt(1_000_000));
        otpRepo.save(OtpToken.builder().voter(voter).election(election).otpCode(otp).expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes)).isUsed(false).build());
        emailService.sendOtpEmail(voter.getEmail(),voter.getFullName(),otp,election.getTitle(),expiryMinutes);
    }
    @Scheduled(fixedRate=3_600_000)
    public void cleanup() { otpRepo.deleteExpiredTokens(LocalDateTime.now()); }
}
