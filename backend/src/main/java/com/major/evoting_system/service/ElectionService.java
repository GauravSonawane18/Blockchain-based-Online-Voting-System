package com.major.evoting_system.service;
import com.major.evoting_system.exception.*;
import com.major.evoting_system.model.*;
import com.major.evoting_system.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
@Service @RequiredArgsConstructor
public class ElectionService {
    private final ElectionRepository electionRepo;
    private final BlockchainService blockchainService;
    private final AuditService auditService;
    public List<Election> getAllElections() { return electionRepo.findByOrderByCreatedAtDesc(); }
    public List<Election> getActiveElections() { return electionRepo.findByStatus(Election.ElectionStatus.ACTIVE); }
    public Election getElectionById(Long id) { return electionRepo.findById(id).orElseThrow(()->new ResourceNotFoundException("Election not found")); }
    @Transactional public Election createElection(Election e,User admin) {
        e.setCreatedBy(admin); e.setStatus(Election.ElectionStatus.PENDING); Election saved=electionRepo.save(e);
        auditService.log("ELECTION_CREATED",admin.getId(),null,null,"Election: "+e.getTitle()); return saved;
    }
    @Transactional public void startElection(Long id,Long adminId) throws Exception {
        Election e=getElectionById(id);
        if(e.getStatus()!=Election.ElectionStatus.PENDING) throw new ElectionException("Not PENDING");
        String tx=blockchainService.startElectionOnChain(); e.setStatus(Election.ElectionStatus.ACTIVE); electionRepo.save(e);
        auditService.log("ELECTION_STARTED",adminId,null,tx,"Started: "+e.getTitle());
    }
    @Transactional public void endElection(Long id,Long adminId) throws Exception {
        Election e=getElectionById(id);
        if(e.getStatus()!=Election.ElectionStatus.ACTIVE) throw new ElectionException("Not ACTIVE");
        String tx=blockchainService.endElectionOnChain(); e.setStatus(Election.ElectionStatus.ENDED); electionRepo.save(e);
        auditService.log("ELECTION_ENDED",adminId,null,tx,"Ended: "+e.getTitle());
    }
}
