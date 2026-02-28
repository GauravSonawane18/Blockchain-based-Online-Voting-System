package com.major.evoting_system.repository;
import com.major.evoting_system.model.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
public interface OtpTokenRepository extends JpaRepository<OtpToken,Long> {
    Optional<OtpToken> findByVoterIdAndElectionIdAndOtpCodeAndIsUsedFalse(Long voterId, Long electionId, String code);
    @Modifying @Transactional @Query("DELETE FROM OtpToken o WHERE o.expiresAt < :now")
    void deleteExpiredTokens(LocalDateTime now);
}
