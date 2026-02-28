package com.major.evoting_system.service;
import com.major.evoting_system.exception.*;
import com.major.evoting_system.model.*;
import com.major.evoting_system.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
@Service @RequiredArgsConstructor @Slf4j
public class AdminService {
    private final UserRepository userRepo;
    private final ElectionRepository electionRepo;
    private final VoterEligibilityRepository eligibilityRepo;
    private final BlockchainService blockchainService;
    private final EmailService emailService;
    private final AuditService auditService;
    private final AuthService authService;
    public List<User> getPendingVoters() { return userRepo.findByVerificationStatus(User.VerificationStatus.PENDING); }
    @Transactional public void approveVoter(Long voterId,Long adminId) throws Exception {
        User voter=userRepo.findById(voterId).orElseThrow(()->new ResourceNotFoundException("Voter not found"));
        if(voter.getVerificationStatus()!=User.VerificationStatus.PENDING) throw new AdminException("Not PENDING");
        String vid=authService.generateVoterId(); voter.setVoterId(vid); voter.setVerificationStatus(User.VerificationStatus.VERIFIED); voter.setActive(true); userRepo.save(voter);
        if(voter.getWalletAddress()!=null) { try { blockchainService.registerVoterOnChain(voter.getWalletAddress()); } catch(Exception e) { log.warn("Blockchain reg failed: {}",e.getMessage()); } }
        emailService.sendVoterApprovalEmail(voter.getEmail(),voter.getFullName(),vid);
        auditService.log("VOTER_APPROVED",adminId,null,null,"Approved: "+voter.getEmail());
    }
    @Transactional public void rejectVoter(Long voterId,String reason,Long adminId) {
        User voter=userRepo.findById(voterId).orElseThrow(()->new ResourceNotFoundException("Voter not found"));
        voter.setVerificationStatus(User.VerificationStatus.REJECTED); userRepo.save(voter);
        emailService.sendVoterRejectionEmail(voter.getEmail(),voter.getFullName(),reason);
        auditService.log("VOTER_REJECTED",adminId,null,null,"Rejected: "+voter.getEmail());
    }
    @Transactional public void assignVoterToElection(Long voterId,Long electionId,Long adminId) {
        User voter=userRepo.findById(voterId).orElseThrow(()->new ResourceNotFoundException("Voter not found"));
        if(voter.getVerificationStatus()!=User.VerificationStatus.VERIFIED) throw new AdminException("Voter not verified");
        if(eligibilityRepo.existsByVoterIdAndElectionIdAndIsEligibleTrue(voterId,electionId)) throw new AdminException("Already assigned");
        Election election=electionRepo.findById(electionId).orElseThrow(()->new ResourceNotFoundException("Election not found"));
        eligibilityRepo.save(VoterEligibility.builder().voter(voter).election(election).isEligible(true).build());
        auditService.log("VOTER_ASSIGNED",adminId,null,null,"Voter "+voter.getVoterId()+" to election "+electionId);
    }
    public long getTotalVoters() { return userRepo.count(); }
    public long getPendingVerificationCount() { return userRepo.findByVerificationStatus(User.VerificationStatus.PENDING).size(); }
}
