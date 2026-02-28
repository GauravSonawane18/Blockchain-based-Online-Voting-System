// test/Voting.test.js
// Run: npx hardhat test

const { expect }  = require("chai");
const { ethers }  = require("hardhat");

describe("Voting Contract", function () {
  let voting, admin, voter1, voter2, voter3;

  // Helper: generate nullifier hash (same logic as backend)
  function makeNullifier(address, salt) {
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "bytes32"],
        [address, ethers.encodeBytes32String(salt)]
      )
    );
  }

  const SALT = "election_secret_salt_2025";

  beforeEach(async function () {
    [admin, voter1, voter2, voter3] = await ethers.getSigners();

    const now       = Math.floor(Date.now() / 1000);
    const startTime = now - 10;         // already started (for testing)
    const endTime   = now + 86400;      // ends in 24h

    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy(
      "Test Election",
      "A test election",
      startTime,
      endTime
    );
    await voting.waitForDeployment();
  });

  // ── Deployment ───────────────────────────────────────────
  describe("Deployment", function () {
    it("should set the admin correctly", async function () {
      expect(await voting.admin()).to.equal(admin.address);
    });

    it("should start in PENDING state", async function () {
      expect(await voting.electionState()).to.equal(0); // 0 = PENDING
    });

    it("should store election metadata", async function () {
      expect(await voting.electionTitle()).to.equal("Test Election");
    });
  });

  // ── Candidates ───────────────────────────────────────────
  describe("Candidate Management", function () {
    it("should allow admin to add candidates", async function () {
      await voting.addCandidate("Alice", "Party A");
      await voting.addCandidate("Bob",   "Party B");
      expect(await voting.candidateCount()).to.equal(2);
    });

    it("should reject candidate addition from non-admin", async function () {
      await expect(
        voting.connect(voter1).addCandidate("Hacker", "Evil Party")
      ).to.be.revertedWith("Only admin allowed");
    });

    it("should reject candidate addition after election starts", async function () {
      await voting.addCandidate("Alice", "Party A");
      await voting.startElection();
      await expect(
        voting.addCandidate("Late Candidate", "Party C")
      ).to.be.revertedWith("Election already started");
    });

    it("should return all candidates correctly", async function () {
      await voting.addCandidate("Alice", "Party A");
      await voting.addCandidate("Bob",   "Party B");
      const [ids, names, parties, voteCounts] = await voting.getAllCandidates();
      expect(names[0]).to.equal("Alice");
      expect(names[1]).to.equal("Bob");
      expect(parties[0]).to.equal("Party A");
      expect(voteCounts[0]).to.equal(0);
    });
  });

  // ── Voter Registration ───────────────────────────────────
  describe("Voter Registration", function () {
    it("should register a voter", async function () {
      await voting.registerVoter(voter1.address);
      expect(await voting.isRegistered(voter1.address)).to.be.true;
    });

    it("should batch register voters", async function () {
      await voting.registerVotersBatch([voter1.address, voter2.address]);
      expect(await voting.isRegistered(voter1.address)).to.be.true;
      expect(await voting.isRegistered(voter2.address)).to.be.true;
    });

    it("should reject duplicate registration", async function () {
      await voting.registerVoter(voter1.address);
      await expect(
        voting.registerVoter(voter1.address)
      ).to.be.revertedWith("Voter already registered");
    });

    it("should allow admin to revoke voter", async function () {
      await voting.registerVoter(voter1.address);
      await voting.revokeVoter(voter1.address);
      expect(await voting.isRegistered(voter1.address)).to.be.false;
    });
  });

  // ── Election Lifecycle ───────────────────────────────────
  describe("Election Lifecycle", function () {
    it("should start the election", async function () {
      await voting.startElection();
      expect(await voting.electionState()).to.equal(1); // ACTIVE
    });

    it("should end the election", async function () {
      await voting.startElection();
      await voting.endElection();
      expect(await voting.electionState()).to.equal(2); // ENDED
    });

    it("should reject starting election twice", async function () {
      await voting.startElection();
      await expect(voting.startElection()).to.be.revertedWith("Election already started");
    });
  });

  // ── Voting ───────────────────────────────────────────────
  describe("Voting", function () {
    beforeEach(async function () {
      await voting.addCandidate("Alice", "Party A");
      await voting.addCandidate("Bob",   "Party B");
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.startElection();
    });

    it("should allow a registered voter to cast a vote", async function () {
      const nullifier = makeNullifier(voter1.address, SALT);
      await voting.connect(voter1).vote(1, nullifier);
      expect(await voting.getVotes(1)).to.equal(1);
      expect(await voting.hasVoted(voter1.address)).to.be.true;
    });

    it("should reject double voting (address check)", async function () {
      const nullifier = makeNullifier(voter1.address, SALT);
      await voting.connect(voter1).vote(1, nullifier);
      await expect(
        voting.connect(voter1).vote(2, nullifier)
      ).to.be.revertedWith("You have already voted (address check)");
    });

    it("should reject double voting (nullifier check)", async function () {
      const nullifier = makeNullifier(voter1.address, SALT);
      await voting.connect(voter1).vote(1, nullifier);
      // Even if a different account somehow has same nullifier — blocked
      await expect(
        voting.connect(voter2).vote(1, nullifier)
      ).to.be.revertedWith("Nullifier already used (hash check)");
    });

    it("should reject vote from unregistered voter", async function () {
      const nullifier = makeNullifier(voter3.address, SALT);
      await expect(
        voting.connect(voter3).vote(1, nullifier)
      ).to.be.revertedWith("Not a registered voter");
    });

    it("should reject vote for invalid candidate", async function () {
      const nullifier = makeNullifier(voter1.address, SALT);
      await expect(
        voting.connect(voter1).vote(99, nullifier)
      ).to.be.revertedWith("Invalid candidate");
    });

    it("should reject vote when election is not active", async function () {
      await voting.endElection();
      const nullifier = makeNullifier(voter1.address, SALT);
      await expect(
        voting.connect(voter1).vote(1, nullifier)
      ).to.be.revertedWith("Election is not active");
    });

    it("should track total votes cast", async function () {
      const n1 = makeNullifier(voter1.address, SALT);
      const n2 = makeNullifier(voter2.address, SALT);
      await voting.connect(voter1).vote(1, n1);
      await voting.connect(voter2).vote(2, n2);
      expect(await voting.totalVotesCast()).to.equal(2);
    });

    it("should emit VoteCast event without voter address", async function () {
      const nullifier = makeNullifier(voter1.address, SALT);
      await expect(voting.connect(voter1).vote(1, nullifier))
        .to.emit(voting, "VoteCast")
        .withArgs(nullifier, 1, (await ethers.provider.getBlock("latest")).timestamp + 1);
    });
  });

  // ── Results ──────────────────────────────────────────────
  describe("Results", function () {
    beforeEach(async function () {
      await voting.addCandidate("Alice", "Party A");
      await voting.addCandidate("Bob",   "Party B");
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.registerVoter(voter3.address);
      await voting.startElection();

      const n1 = makeNullifier(voter1.address, SALT);
      const n2 = makeNullifier(voter2.address, SALT);
      const n3 = makeNullifier(voter3.address, SALT);

      await voting.connect(voter1).vote(1, n1); // Alice
      await voting.connect(voter2).vote(1, n2); // Alice
      await voting.connect(voter3).vote(2, n3); // Bob

      await voting.endElection();
    });

    it("should return correct vote counts", async function () {
      expect(await voting.getVotes(1)).to.equal(2); // Alice
      expect(await voting.getVotes(2)).to.equal(1); // Bob
    });

    it("should return the correct winner", async function () {
      const [winnerId, winnerName, winVotes] = await voting.getWinner();
      expect(winnerName).to.equal("Alice");
      expect(winVotes).to.equal(2);
    });

    it("should reject getWinner before election ends", async function () {
      // Fresh deployment still in PENDING
      const now = Math.floor(Date.now() / 1000);
      const Voting = await ethers.getContractFactory("Voting");
      const fresh = await Voting.deploy("Fresh", "desc", now - 10, now + 86400);
      await fresh.waitForDeployment();
      await expect(fresh.getWinner()).to.be.revertedWith("Election not ended yet");
    });
  });
});
