package com.major.evoting_system.service;
import com.major.evoting_system.exception.*;
import com.major.evoting_system.model.*;
import com.major.evoting_system.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
@Service @RequiredArgsConstructor
public class CandidateService {
    private final CandidateRepository candidateRepo;
    private final ElectionRepository electionRepo;
    private final BlockchainService blockchainService;
    public List<Candidate> getCandidatesByElection(Long electionId) { return candidateRepo.findByElectionId(electionId); }
    @Transactional public Candidate addCandidate(Long electionId,String name,String party,String desc,Long adminId) throws Exception {
        Election election=electionRepo.findById(electionId).orElseThrow(()->new ResourceNotFoundException("Election not found"));
        if(election.getStatus()!=Election.ElectionStatus.PENDING) throw new ElectionException("Election already started");
        blockchainService.addCandidateOnChain(name,party);
        long chainId=candidateRepo.countByElectionId(electionId)+1;
        return candidateRepo.save(Candidate.builder().election(election).name(name).party(party).description(desc).candidateIdOnChain(chainId).build());
    }
}
