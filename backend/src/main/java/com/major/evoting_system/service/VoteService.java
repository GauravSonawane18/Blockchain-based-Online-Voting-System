package com.major.evoting_system.service;
import com.major.evoting_system.dto.VoteDTOs.*;
import com.major.evoting_system.exception.*;
import com.major.evoting_system.model.*;
import com.major.evoting_system.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
@Service @RequiredArgsConstructor
public class VoteService {
    private final VoteRepository voteRepo;
    private final OtpTokenRepository otpRepo;
    private final ElectionRepository electionRepo;
    private final CandidateRepository candidateRepo;
    private final VoterEligibilityRepository eligibilityRepo;
    private final UserRepository userRepo;
    private final OtpService otpService;
    private final BlockchainService blockchainService;
    private final AuditService auditService;
    public void generateOtpForVoting(Long voterId,Long electionId) {
        User voter=userRepo.findById(voterId).orElseThrow(()->new ResourceNotFoundException("Voter not found"));
        Election election=electionRepo.findById(electionId).orElseThrow(()->new ResourceNotFoundException("Election not found"));
        if(election.getStatus()!=Election.ElectionStatus.ACTIVE) throw new VotingException("Election not active");
        if(!eligibilityRepo.existsByVoterIdAndElectionIdAndIsEligibleTrue(voterId,electionId)) throw new VotingException("Not eligible to vote");
        if(voteRepo.existsByVoterIdAndElectionId(voterId,electionId)) throw new VotingException("Already voted");
        otpService.generateAndSendOtp(voter,election);
    }
    public String verifyOtpAndGetNullifier(Long voterId,Long electionId,String otpCode) {
        User voter=userRepo.findById(voterId).orElseThrow(()->new ResourceNotFoundException("Voter not found"));
        OtpToken token=otpRepo.findByVoterIdAndElectionIdAndOtpCodeAndIsUsedFalse(voterId,electionId,otpCode).orElseThrow(()->new InvalidOtpException("Invalid or expired OTP"));
        if(token.getExpiresAt().isBefore(LocalDateTime.now())) throw new InvalidOtpException("OTP expired");
        token.setUsed(true); otpRepo.save(token);
        if(voter.getWalletAddress()==null) throw new VotingException("No wallet address linked");
        return blockchainService.generateNullifierHash(voter.getWalletAddress());
    }
    @Transactional public VoteReceiptResponse saveVoteReceipt(Long voterId,Long electionId,Long candidateId,String txHash,String nullifierHash) {
        if(!blockchainService.verifyTransactionHash(txHash)) throw new VotingException("Transaction not confirmed on blockchain");
        if(voteRepo.existsByVoterIdAndElectionId(voterId,electionId)) throw new VotingException("Vote already recorded");
        User voter=userRepo.findById(voterId).orElseThrow(()->new ResourceNotFoundException("Voter not found"));
        Election election=electionRepo.findById(electionId).orElseThrow(()->new ResourceNotFoundException("Election not found"));
        Candidate candidate=candidateRepo.findById(candidateId).orElseThrow(()->new ResourceNotFoundException("Candidate not found"));
        Vote vote=voteRepo.save(Vote.builder().voter(voter).election(election).candidate(candidate).transactionHash(txHash).nullifierHash(nullifierHash).votedAt(LocalDateTime.now()).build());
        auditService.log("VOTE_CAST",voterId,null,txHash,"Voted in: "+election.getTitle());
        return VoteReceiptResponse.builder().transactionHash(txHash).nullifierHash(nullifierHash).candidateName(candidate.getName()).electionTitle(election.getTitle()).votedAt(vote.getVotedAt()).blockchainExplorerUrl("http://localhost:8545/tx/"+txHash).build();
    }
    public boolean hasVoted(Long voterId,Long electionId) { return voteRepo.existsByVoterIdAndElectionId(voterId,electionId); }
}
