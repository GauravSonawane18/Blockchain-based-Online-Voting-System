// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {

    address public admin;
    bool public electionActive;

    constructor() {
        admin = msg.sender;
        electionActive = false;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyDuringElection() {
        require(electionActive, "Election not active");
        _;
    }

    // ===== CANDIDATE STRUCT =====
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    // ===== VOTER STRUCT =====
    struct Voter {
        bool registered;
        bool hasVoted;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => Voter) public voters;

    uint public candidateCount;

    // ===== ADMIN FUNCTIONS =====

    function startElection() public onlyAdmin {
        electionActive = true;
    }

    function endElection() public onlyAdmin {
        electionActive = false;
    }

    function addCandidate(string memory _name) public onlyAdmin {
        candidateCount++;
        candidates[candidateCount] = Candidate(candidateCount, _name, 0);
    }

    function registerVoter(address _voter) public onlyAdmin {
        voters[_voter].registered = true;
    }

    // ===== VOTING FUNCTION =====

    function vote(uint _candidateId) public onlyDuringElection {

        Voter storage sender = voters[msg.sender];

        require(sender.registered, "Not registered");
        require(!sender.hasVoted, "Already voted");
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate");

        sender.hasVoted = true;
        candidates[_candidateId].voteCount++;
    }

    // ===== RESULT FUNCTION =====

    function getVotes(uint _candidateId) public view returns (uint) {
        return candidates[_candidateId].voteCount;
    }
}
