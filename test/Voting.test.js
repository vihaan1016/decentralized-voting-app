const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let voting;
  let owner;
  let voter1;
  let voter2;
  let nonVoter;

  beforeEach(async function () {
    [owner, voter1, voter2, nonVoter] = await ethers.getSigners();
    
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("Should initialize with election inactive", async function () {
      expect(await voting.electionActive()).to.be.false;
    });

    it("Should initialize with zero candidates", async function () {
      expect(await voting.candidatesCount()).to.equal(0);
    });
  });

  describe("Election Management", function () {
    it("Should allow owner to start election", async function () {
      await voting.startElection();
      expect(await voting.electionActive()).to.be.true;
    });

    it("Should allow owner to end election", async function () {
      await voting.startElection();
      await voting.endElection();
      expect(await voting.electionActive()).to.be.false;
    });

    it("Should not allow non-owner to start election", async function () {
      await expect(voting.connect(voter1).startElection())
        .to.be.revertedWith("Only the owner can perform this action");
    });

    it("Should not allow starting election twice", async function () {
      await voting.startElection();
      await expect(voting.startElection())
        .to.be.revertedWith("Election is already active");
    });
  });

  describe("Candidate Management", function () {
    it("Should allow owner to add candidates before election starts", async function () {
      await voting.addCandidate("Alice");
      expect(await voting.candidatesCount()).to.equal(1);
      
      const candidate = await voting.getCandidate(0);
      expect(candidate[0]).to.equal("Alice");
      expect(candidate[1]).to.equal(0);
    });

    it("Should not allow adding candidates during active election", async function () {
      await voting.startElection();
      await expect(voting.addCandidate("Alice"))
        .to.be.revertedWith("Cannot add candidates during active election");
    });

    it("Should not allow non-owner to add candidates", async function () {
      await expect(voting.connect(voter1).addCandidate("Alice"))
        .to.be.revertedWith("Only the owner can perform this action");
    });

    it("Should emit CandidateAdded event", async function () {
      await expect(voting.addCandidate("Alice"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(0, "Alice");
    });
  });

  describe("Voter Registration", function () {
    it("Should allow owner to register voters", async function () {
      await voting.registerVoter(voter1.address);
      expect(await voting.isRegisteredVoter(voter1.address)).to.be.true;
    });

    it("Should not allow registering the same voter twice", async function () {
      await voting.registerVoter(voter1.address);
      await expect(voting.registerVoter(voter1.address))
        .to.be.revertedWith("Voter is already registered");
    });

    it("Should not allow non-owner to register voters", async function () {
      await expect(voting.connect(voter1).registerVoter(voter2.address))
        .to.be.revertedWith("Only the owner can perform this action");
    });

    it("Should emit VoterRegistered event", async function () {
      await expect(voting.registerVoter(voter1.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter1.address);
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await voting.addCandidate("Alice");
      await voting.addCandidate("Bob");
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.startElection();
    });

    it("Should allow registered voters to vote", async function () {
      await voting.connect(voter1).vote(0);
      
      const candidate = await voting.getCandidate(0);
      expect(candidate[1]).to.equal(1);
      expect(await voting.hasVoterVoted(voter1.address)).to.be.true;
    });

    it("Should not allow unregistered voters to vote", async function () {
      await expect(voting.connect(nonVoter).vote(0))
        .to.be.revertedWith("Only registered voters can vote");
    });

    it("Should not allow voting twice", async function () {
      await voting.connect(voter1).vote(0);
      await expect(voting.connect(voter1).vote(1))
        .to.be.revertedWith("You have already voted");
    });

    it("Should not allow voting for invalid candidate", async function () {
      await expect(voting.connect(voter1).vote(2))
        .to.be.revertedWith("Invalid candidate ID");
    });

    it("Should not allow voting when election is not active", async function () {
      await voting.endElection();
      await expect(voting.connect(voter1).vote(0))
        .to.be.revertedWith("Election is not active");
    });

    it("Should emit VoteCast event", async function () {
      await expect(voting.connect(voter1).vote(0))
        .to.emit(voting, "VoteCast")
        .withArgs(voter1.address, 0);
    });

    it("Should track vote counts correctly", async function () {
      await voting.connect(voter1).vote(0);
      await voting.connect(voter2).vote(1);
      
      const alice = await voting.getCandidate(0);
      const bob = await voting.getCandidate(1);
      
      expect(alice[1]).to.equal(1);
      expect(bob[1]).to.equal(1);
    });
  });

  describe("Results", function () {
    beforeEach(async function () {
      await voting.addCandidate("Alice");
      await voting.addCandidate("Bob");
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.startElection();
    });

    it("Should return correct results", async function () {
      await voting.connect(voter1).vote(0);
      await voting.connect(voter2).vote(1);
      
      const results = await voting.getResults();
      
      expect(results.length).to.equal(2);
      expect(results[0].name).to.equal("Alice");
      expect(results[0].voteCount).to.equal(1);
      expect(results[1].name).to.equal("Bob");
      expect(results[1].voteCount).to.equal(1);
    });

    it("Should return empty results when no votes cast", async function () {
      const results = await voting.getResults();
      
      expect(results.length).to.equal(2);
      expect(results[0].voteCount).to.equal(0);
      expect(results[1].voteCount).to.equal(0);
    });
  });
});
