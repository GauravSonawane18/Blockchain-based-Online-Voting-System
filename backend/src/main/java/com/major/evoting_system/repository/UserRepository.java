package com.major.evoting_system.repository;
import com.major.evoting_system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByWalletAddress(String walletAddress);
    boolean existsByEmail(String email);
    boolean existsByWalletAddress(String walletAddress);
    List<User> findByVerificationStatus(User.VerificationStatus status);
}
