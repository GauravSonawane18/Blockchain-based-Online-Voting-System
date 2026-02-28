package com.major.evoting_system.controller;
import com.major.evoting_system.model.*;
import com.major.evoting_system.repository.CandidateRepository;
import com.major.evoting_system.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigInteger;
import java.util.*;
@RestController @RequestMapping("/api/results") @RequiredArgsConstructor
public class ResultController {
    private final ElectionService electionService;
    private final CandidateRepository candidateRepo;
    private final BlockchainService blockchainService;
    @GetMapping("/{electionId}") public ResponseEntity<?> results(@PathVariable Long electionId) throws Exception {
        Election election=electionService.getElectionById(electionId);
        List<Candidate> candidates=candidateRepo.findByElectionId(electionId);
        List<Map<String,Object>> results=new ArrayList<>(); long total=0;
        for(Candidate c:candidates) {
            long votes=blockchainService.getVoteCountFromChain(BigInteger.valueOf(c.getCandidateIdOnChain())).longValue(); total+=votes;
            results.add(new HashMap<>(Map.of("candidateId",c.getId(),"name",c.getName(),"party",c.getParty()!=null?c.getParty():"","voteCount",votes)));
        }
        final long t=total; results.forEach(r->r.put("percentage",t>0?Math.round((long)r.get("voteCount")*1000.0/t)/10.0:0));
        return ResponseEntity.ok(Map.of("electionId",electionId,"electionTitle",election.getTitle(),"status",election.getStatus().name(),"totalVotes",total,"candidates",results));
    }
}
