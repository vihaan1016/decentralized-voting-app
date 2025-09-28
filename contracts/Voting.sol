// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Voting {
    // State variables
    address public owner;
    bool public electionActive;
    
    struct Candidate {
        string name;
        uint256 voteCount;
    }
    
    mapping(uint256 => Candidate) public candidates;
    uint256 public candidatesCount;
    
    mapping(address => bool) public voters;
    mapping(address => bool) public hasVoted;
    
    // Events
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterRegistered(address indexed voter);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event ElectionStarted();
    event ElectionEnded();
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }
    
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender], "Only registered voters can vote");
        _;
    }
    
    modifier hasNotVoted() {
        require(!hasVoted[msg.sender], "You have already voted");
        _;
    }
    
    modifier electionIsActive() {
        require(electionActive, "Election is not active");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        electionActive = false;
        candidatesCount = 0;
    }
    
    // Functions
    function startElection() public onlyOwner {
        require(!electionActive, "Election is already active");
        electionActive = true;
        emit ElectionStarted();
    }
    
    function endElection() public onlyOwner {
        require(electionActive, "Election is not active");
        electionActive = false;
        emit ElectionEnded();
    }
    
    function addCandidate(string memory _name) public onlyOwner {
        require(!electionActive, "Cannot add candidates during active election");
        candidates[candidatesCount] = Candidate({
            name: _name,
            voteCount: 0
        });
        emit CandidateAdded(candidatesCount, _name);
        candidatesCount++;
    }
    
    function registerVoter(address _voterAddress) public onlyOwner {
        require(!voters[_voterAddress], "Voter is already registered");
        voters[_voterAddress] = true;
        emit VoterRegistered(_voterAddress);
    }
    
    function vote(uint256 _candidateId) public onlyRegisteredVoter hasNotVoted electionIsActive {
        require(_candidateId < candidatesCount, "Invalid candidate ID");
        
        candidates[_candidateId].voteCount++;
        hasVoted[msg.sender] = true;
        
        emit VoteCast(msg.sender, _candidateId);
    }
    
    function getResults() public view returns (Candidate[] memory) {
        Candidate[] memory results = new Candidate[](candidatesCount);
        for (uint256 i = 0; i < candidatesCount; i++) {
            results[i] = candidates[i];
        }
        return results;
    }
    
    function getCandidate(uint256 _candidateId) public view returns (string memory, uint256) {
        require(_candidateId < candidatesCount, "Invalid candidate ID");
        return (candidates[_candidateId].name, candidates[_candidateId].voteCount);
    }
    
    function isRegisteredVoter(address _voter) public view returns (bool) {
        return voters[_voter];
    }
    
    function hasVoterVoted(address _voter) public view returns (bool) {
        return hasVoted[_voter];
    }
}
