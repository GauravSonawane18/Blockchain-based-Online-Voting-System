package com.major.evoting_system.service;
import com.major.evoting_system.model.AuditLog;
import com.major.evoting_system.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import java.util.List;
@Service @RequiredArgsConstructor
public class AuditService {
    private final AuditLogRepository repo;
    public void log(String action,Long userId,String ip,String tx,String details) {
        repo.save(AuditLog.builder().action(action).userId(userId).ipAddress(ip).transactionHash(tx).details(details).build());
    }
    public Page<AuditLog> getAllLogs(int page,int size) { return repo.findAllByOrderByTimestampDesc(PageRequest.of(page,size)); }
    public List<AuditLog> getLogsByUser(Long uid) { return repo.findByUserIdOrderByTimestampDesc(uid); }
    public List<AuditLog> getBlockchainTransactions() { return repo.findByTransactionHashNotNull(); }
}
