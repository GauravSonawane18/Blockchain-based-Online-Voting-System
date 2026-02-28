// ============================================================
//  contract.js — Auto-generated after deploying Voting.sol
//  Replace PASTE_YOUR_CONTRACT_ADDRESS after running:
//    npx hardhat run scripts/deploy.js --network localhost
// ============================================================

export const contractAddress = "PASTE_YOUR_CONTRACT_ADDRESS";

export const contractABI = [
  // ── Constructor ──────────────────────────────────────────
  {
    "inputs": [
      { "internalType": "string",  "name": "_title",       "type": "string"  },
      { "internalType": "string",  "name": "_description", "type": "string"  },
      { "internalType": "uint256", "name": "_startTime",   "type": "uint256" },
      { "internalType": "uint256", "name": "_endTime",     "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },

  // ── Events ───────────────────────────────────────────────
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string",  "name": "title",       "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "description", "type": "string"  },
      { "indexed": false, "internalType": "address", "name": "admin",       "type": "address" }
    ],
    "name": "ElectionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "ElectionStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "timestamp",  "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "totalVotes", "type": "uint256" }
    ],
    "name": "ElectionEnded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "uint256", "name": "candidateId", "type": "uint256" },
      { "indexed": false, "internalType": "string",  "name": "name",        "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "party",       "type": "string"  }
    ],
    "name": "CandidateAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "voter", "type": "address" }
    ],
    "name": "VoterRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "bytes32", "name": "nullifierHash", "type": "bytes32" },
      { "indexed": true,  "internalType": "uint256", "name": "candidateId",   "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",     "type": "uint256" }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "voter", "type": "address" }
    ],
    "name": "VoterRevoked",
    "type": "event"
  },

  // ── Admin — Election Lifecycle ───────────────────────────
  {
    "inputs": [],
    "name": "startElection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "endElection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ── Admin — Candidates ───────────────────────────────────
  {
    "inputs": [
      { "internalType": "string", "name": "_name",  "type": "string" },
      { "internalType": "string", "name": "_party", "type": "string" }
    ],
    "name": "addCandidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ── Admin — Voters ───────────────────────────────────────
  {
    "inputs": [
      { "internalType": "address", "name": "_voter", "type": "address" }
    ],
    "name": "registerVoter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address[]", "name": "_voters", "type": "address[]" }
    ],
    "name": "registerVotersBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_voter", "type": "address" }
    ],
    "name": "revokeVoter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ── Core — Vote Casting ──────────────────────────────────
  {
    "inputs": [
      { "internalType": "uint256", "name": "_candidateId",   "type": "uint256" },
      { "internalType": "bytes32", "name": "_nullifierHash", "type": "bytes32" }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ── View — Results & Data ────────────────────────────────
  {
    "inputs": [
      { "internalType": "uint256", "name": "_candidateId", "type": "uint256" }
    ],
    "name": "getVotes",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCandidates",
    "outputs": [
      { "internalType": "uint256[]", "name": "ids",        "type": "uint256[]" },
      { "internalType": "string[]",  "name": "names",      "type": "string[]"  },
      { "internalType": "string[]",  "name": "parties",    "type": "string[]"  },
      { "internalType": "uint256[]", "name": "voteCounts", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getElectionInfo",
    "outputs": [
      { "internalType": "string",  "name": "title",         "type": "string"  },
      { "internalType": "string",  "name": "description",   "type": "string"  },
      { "internalType": "uint8",   "name": "state",         "type": "uint8"   },
      { "internalType": "uint256", "name": "startTime",     "type": "uint256" },
      { "internalType": "uint256", "name": "endTime",       "type": "uint256" },
      { "internalType": "uint256", "name": "totalVotes",    "type": "uint256" },
      { "internalType": "uint256", "name": "numCandidates", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getWinner",
    "outputs": [
      { "internalType": "uint256", "name": "winnerId",   "type": "uint256" },
      { "internalType": "string",  "name": "winnerName", "type": "string"  },
      { "internalType": "uint256", "name": "winVotes",   "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_voter", "type": "address" }
    ],
    "name": "hasVoted",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_voter", "type": "address" }
    ],
    "name": "isRegistered",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_nullifierHash", "type": "bytes32" }
    ],
    "name": "isNullifierUsed",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // ── Public State Variables ───────────────────────────────
  {
    "inputs": [],
    "name": "admin",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "candidateCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "electionState",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "electionTitle",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalVotesCast",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "candidates",
    "outputs": [
      { "internalType": "uint256", "name": "id",        "type": "uint256" },
      { "internalType": "string",  "name": "name",      "type": "string"  },
      { "internalType": "string",  "name": "party",     "type": "string"  },
      { "internalType": "uint256", "name": "voteCount", "type": "uint256" },
      { "internalType": "bool",    "name": "exists",    "type": "bool"    }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "voters",
    "outputs": [
      { "internalType": "bool", "name": "registered", "type": "bool" },
      { "internalType": "bool", "name": "hasVoted",   "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
