package com.major.evoting_system.repository;
import com.major.evoting_system.model.AuditLog;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AuditLogRepository extends JpaRepository<AuditLog,Long> {
    List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId);
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    List<AuditLog> findByTransactionHashNotNull();
}
