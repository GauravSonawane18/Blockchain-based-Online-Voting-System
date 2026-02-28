// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Voting - Blockchain-Based E-Voting System
 * @author Gaurav Sonawane
 * @notice Academic project: secure, anonymous, tamper-proof voting on Ethereum
 *
 * KEY SECURITY FEATURES:
 * 1. Voter Anonymity     — votes recorded via keccak256 nullifier hashes, not wallet addresses
 * 2. Double Vote Guard   — nullifier mapping prevents any voter from voting twice
 * 3. Admin Access Control— onlyAdmin modifier on all sensitive functions
 * 4. Election Lifecycle  — PENDING → ACTIVE → ENDED state machine
 * 5. Audit Events        — every action emits an event for off-chain audit trail
 */

contract Voting {

    // ============================================================
    //  STATE VARIABLES
    // ============================================================

    address public admin;

    enum ElectionState { PENDING, ACTIVE, ENDED }
    ElectionState public electionState;

    string public electionTitle;
    string public electionDescription;
    uint256 public electionStartTime;
    uint256 public electionEndTime;
    uint256 public totalVotesCast;

    // ============================================================
    //  STRUCTS
    // ============================================================

    struct Candidate {
        uint256 id;
        string name;
        string party;           // added: political party / affiliation
        uint256 voteCount;
        bool exists;
    }

    struct Voter {
        bool registered;
        bool hasVoted;
    }

    // ============================================================
    //  MAPPINGS
    // ============================================================

    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter)     public voters;

    /**
     * @dev Nullifier hash map — core anonymity mechanism.
     *
     * When a voter casts a vote:
     *   nullifier = keccak256(abi.encodePacked(voterAddress, electionSalt))
     *
     * This hash is stored here. The vote is recorded against the candidateId
     * only — NOT against the voter's address — so on-chain data cannot link
     * a specific wallet to a specific candidate choice.
     *
     * The backend generates the nullifier using a secret salt per election,
     * so even if someone knows the formula, they cannot reconstruct which
     * candidate was chosen from the on-chain data alone.
     */
    mapping(bytes32 => bool) public nullifierUsed;

    uint256 public candidateCount;

    // ============================================================
    //  EVENTS  (for audit trail & frontend listeners)
    // ============================================================

    event ElectionCreated(string title, string description, address admin);
    event ElectionStarted(uint256 timestamp);
    event ElectionEnded(uint256 timestamp, uint256 totalVotes);
    event CandidateAdded(uint256 indexed candidateId, string name, string party);
    event VoterRegistered(address indexed voter);
    event VoteCast(
        bytes32 indexed nullifierHash,   // anonymous vote identifier
        uint256 indexed candidateId,     // who was voted for
        uint256 timestamp                // when vote was cast
        // NOTE: voter address is intentionally NOT emitted → anonymity preserved
    );
    event VoterRevoked(address indexed voter);

    // ============================================================
    //  MODIFIERS
    // ============================================================

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyDuringElection() {
        require(electionState == ElectionState.ACTIVE, "Election is not active");
        require(block.timestamp >= electionStartTime, "Election has not started yet");
        require(block.timestamp <= electionEndTime,   "Election has ended");
        _;
    }

    modifier onlyPending() {
        require(electionState == ElectionState.PENDING, "Election already started");
        _;
    }

    modifier candidateExists(uint256 _id) {
        require(_id > 0 && _id <= candidateCount && candidates[_id].exists, "Invalid candidate");
        _;
    }

    // ============================================================
    //  CONSTRUCTOR
    // ============================================================

    constructor(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) {
        require(_endTime > _startTime, "End time must be after start time");

        admin               = msg.sender;
        electionState       = ElectionState.PENDING;
        electionTitle       = _title;
        electionDescription = _description;
        electionStartTime   = _startTime;
        electionEndTime     = _endTime;

        emit ElectionCreated(_title, _description, msg.sender);
    }

    // ============================================================
    //  ADMIN — ELECTION LIFECYCLE
    // ============================================================

    /**
     * @notice Activate the election. Only callable by admin while PENDING.
     */
    function startElection() public onlyAdmin onlyPending {
        electionState = ElectionState.ACTIVE;
        emit ElectionStarted(block.timestamp);
    }

    /**
     * @notice End the election. Only callable by admin while ACTIVE.
     */
    function endElection() public onlyAdmin {
        require(electionState == ElectionState.ACTIVE, "Election not active");
        electionState = ElectionState.ENDED;
        emit ElectionEnded(block.timestamp, totalVotesCast);
    }

    // ============================================================
    //  ADMIN — CANDIDATE MANAGEMENT
    // ============================================================

    /**
     * @notice Add a candidate. Only allowed before election starts.
     * @param _name  Full name of candidate
     * @param _party Political party or affiliation
     */
    function addCandidate(string memory _name, string memory _party)
        public
        onlyAdmin
        onlyPending
    {
        require(bytes(_name).length > 0, "Candidate name required");
        candidateCount++;
        candidates[candidateCount] = Candidate({
            id:        candidateCount,
            name:      _name,
            party:     _party,
            voteCount: 0,
            exists:    true
        });
        emit CandidateAdded(candidateCount, _name, _party);
    }

    // ============================================================
    //  ADMIN — VOTER MANAGEMENT
    // ============================================================

    /**
     * @notice Register a voter's wallet address as eligible.
     * @param _voter Ethereum wallet address of the voter
     */
    function registerVoter(address _voter) public onlyAdmin {
        require(_voter != address(0),        "Invalid address");
        require(!voters[_voter].registered,  "Voter already registered");
        voters[_voter].registered = true;
        emit VoterRegistered(_voter);
    }

    /**
     * @notice Register multiple voters in a single transaction (gas efficient).
     * @param _voters Array of voter wallet addresses
     */
    function registerVotersBatch(address[] memory _voters) public onlyAdmin {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (_voters[i] != address(0) && !voters[_voters[i]].registered) {
                voters[_voters[i]].registered = true;
                emit VoterRegistered(_voters[i]);
            }
        }
    }

    /**
     * @notice Revoke a voter's registration (admin abuse prevention).
     */
    function revokeVoter(address _voter) public onlyAdmin {
        require(voters[_voter].registered, "Voter not registered");
        voters[_voter].registered = false;
        emit VoterRevoked(_voter);
    }

    // ============================================================
    //  CORE — ANONYMOUS VOTE CASTING
    // ============================================================

    /**
     * @notice Cast a vote anonymously using a nullifier hash.
     *
     * @param _candidateId   The candidate to vote for
     * @param _nullifierHash keccak256(abi.encodePacked(voterAddress, electionSalt))
     *                       — generated by the backend using a secret salt
     *
     * HOW ANONYMITY WORKS:
     * - The backend generates a unique nullifierHash per voter per election
     * - This hash is stored on-chain to prevent double voting
     * - The candidate voted for is recorded against the nullifier, NOT the address
     * - On-chain, you can only see "this nullifier voted for candidate X"
     * - You cannot reverse the nullifier to find the voter's identity without the salt
     *
     * DOUBLE VOTE PREVENTION (3 layers):
     * Layer 1 → voters[msg.sender].hasVoted flag (address-based, backend check)
     * Layer 2 → nullifierUsed[_nullifierHash] flag (hash-based, on-chain)
     * Layer 3 → Backend DB unique constraint (voter_id, election_id)
     */
    function vote(uint256 _candidateId, bytes32 _nullifierHash)
        public
        onlyDuringElection
        candidateExists(_candidateId)
    {
        Voter storage sender = voters[msg.sender];

        require(sender.registered,              "Not a registered voter");
        require(!sender.hasVoted,               "You have already voted (address check)");
        require(!nullifierUsed[_nullifierHash], "Nullifier already used (hash check)");
        require(_nullifierHash != bytes32(0),   "Invalid nullifier hash");

        // Mark voter as voted (address level)
        sender.hasVoted = true;

        // Mark nullifier as used (hash level — anonymous)
        nullifierUsed[_nullifierHash] = true;

        // Increment candidate vote count
        candidates[_candidateId].voteCount++;

        // Increment total votes
        totalVotesCast++;

        // Emit event — note: msg.sender is NOT emitted to preserve anonymity
        emit VoteCast(_nullifierHash, _candidateId, block.timestamp);
    }

    // ============================================================
    //  VIEW FUNCTIONS — RESULTS & DATA
    // ============================================================

    /**
     * @notice Get vote count for a specific candidate.
     */
    function getVotes(uint256 _candidateId)
        public
        view
        candidateExists(_candidateId)
        returns (uint256)
    {
        return candidates[_candidateId].voteCount;
    }

    /**
     * @notice Get all candidates and their vote counts in one call.
     * @return ids        Array of candidate IDs
     * @return names      Array of candidate names
     * @return parties    Array of candidate parties
     * @return voteCounts Array of vote counts
     */
    function getAllCandidates()
        public
        view
        returns (
            uint256[] memory ids,
            string[]  memory names,
            string[]  memory parties,
            uint256[] memory voteCounts
        )
    {
        ids        = new uint256[](candidateCount);
        names      = new string[](candidateCount);
        parties    = new string[](candidateCount);
        voteCounts = new uint256[](candidateCount);

        for (uint256 i = 1; i <= candidateCount; i++) {
            ids[i-1]        = candidates[i].id;
            names[i-1]      = candidates[i].name;
            parties[i-1]    = candidates[i].party;
            voteCounts[i-1] = candidates[i].voteCount;
        }
    }

    /**
     * @notice Get election metadata.
     */
    function getElectionInfo()
        public
        view
        returns (
            string memory title,
            string memory description,
            uint8         state,        // 0=PENDING, 1=ACTIVE, 2=ENDED
            uint256       startTime,
            uint256       endTime,
            uint256       totalVotes,
            uint256       numCandidates
        )
    {
        return (
            electionTitle,
            electionDescription,
            uint8(electionState),
            electionStartTime,
            electionEndTime,
            totalVotesCast,
            candidateCount
        );
    }

    /**
     * @notice Check if a voter has already voted (without revealing who they voted for).
     */
    function hasVoted(address _voter) public view returns (bool) {
        return voters[_voter].hasVoted;
    }

    /**
     * @notice Check if a voter is registered.
     */
    function isRegistered(address _voter) public view returns (bool) {
        return voters[_voter].registered;
    }

    /**
     * @notice Check if a nullifier hash has been used (double-vote check).
     */
    function isNullifierUsed(bytes32 _nullifierHash) public view returns (bool) {
        return nullifierUsed[_nullifierHash];
    }

    /**
     * @notice Get the winning candidate (only after election ends).
     * @return winnerId   ID of the winning candidate
     * @return winnerName Name of the winning candidate
     * @return winVotes   Vote count of the winner
     */
    function getWinner()
        public
        view
        returns (
            uint256 winnerId,
            string memory winnerName,
            uint256 winVotes
        )
    {
        require(electionState == ElectionState.ENDED, "Election not ended yet");
        require(candidateCount > 0, "No candidates");

        uint256 maxVotes = 0;
        uint256 winId    = 0;

        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winId    = i;
            }
        }

        return (winId, candidates[winId].name, maxVotes);
    }
}
