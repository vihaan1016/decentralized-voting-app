import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './App.css';
import contractInfo from './contractInfo.json';

// Contract address and ABI from deployment
const CONTRACT_ADDRESS = contractInfo.address;
const CONTRACT_ABI = contractInfo.abi;

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [electionActive, setElectionActive] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [isRegisteredVoter, setIsRegisteredVoter] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newVoterAddress, setNewVoterAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        setContract(contract);
        
        // Check if user is owner
        const owner = await contract.owner();
        setIsOwner(owner.toLowerCase() === accounts[0].toLowerCase());
        
        // Load initial data
        await loadContractData(contract);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Load contract data
  const loadContractData = useCallback(async (contract) => {
    try {
      const [electionActive, candidatesCount, isRegistered, hasVotedStatus] = await Promise.all([
        contract.electionActive(),
        contract.candidatesCount(),
        contract.isRegisteredVoter(account),
        contract.hasVoterVoted(account)
      ]);
      
      setElectionActive(electionActive);
      setIsRegisteredVoter(isRegistered);
      setHasVoted(hasVotedStatus);
      
      // Load candidates
      const candidatesData = [];
      for (let i = 0; i < Number(candidatesCount); i++) {
        const candidate = await contract.getCandidate(i);
        candidatesData.push({
          id: i,
          name: candidate[0],
          voteCount: Number(candidate[1])
        });
      }
      setCandidates(candidatesData);
    } catch (error) {
      console.error('Error loading contract data:', error);
    }
  }, [account]);

  // Start election
  const startElection = async () => {
    if (!contract || !isOwner) return;
    
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      await contractWithSigner.startElection();
      setElectionActive(true);
    } catch (error) {
      console.error('Error starting election:', error);
      alert('Error starting election: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // End election
  const endElection = async () => {
    if (!contract || !isOwner) return;
    
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      await contractWithSigner.endElection();
      setElectionActive(false);
    } catch (error) {
      console.error('Error ending election:', error);
      alert('Error ending election: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add candidate
  const addCandidate = async () => {
    if (!contract || !isOwner || !newCandidateName.trim()) return;
    
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      await contractWithSigner.addCandidate(newCandidateName);
      setNewCandidateName('');
      await loadContractData(contract);
    } catch (error) {
      console.error('Error adding candidate:', error);
      alert('Error adding candidate: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Register voter
  const registerVoter = async () => {
    if (!contract || !isOwner || !newVoterAddress.trim()) return;
    
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      await contractWithSigner.registerVoter(newVoterAddress);
      setNewVoterAddress('');
      if (newVoterAddress.toLowerCase() === account.toLowerCase()) {
        setIsRegisteredVoter(true);
      }
    } catch (error) {
      console.error('Error registering voter:', error);
      alert('Error registering voter: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Vote for candidate
  const vote = async (candidateId) => {
    if (!contract || !isRegisteredVoter || hasVoted) return;
    
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      await contractWithSigner.vote(candidateId);
      setHasVoted(true);
      await loadContractData(contract);
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error voting: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    if (contract) {
      await loadContractData(contract);
    }
  };

  useEffect(() => {
    if (account && contract) {
      loadContractData(contract);
    }
  }, [account, contract, loadContractData]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🗳️ Decentralized Voting App</h1>
        
        {!account ? (
          <button onClick={connectWallet} className="connect-button">
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <p>Connected: {account}</p>
            {isOwner && <span className="owner-badge">👑 Owner</span>}
          </div>
        )}
      </header>

      {account && (
        <main className="main-content">
          {/* Admin Panel */}
          {isOwner && (
            <div className="admin-panel">
              <h2>Admin Panel</h2>
              
              <div className="election-controls">
                <h3>Election Controls</h3>
                {!electionActive ? (
                  <button onClick={startElection} disabled={loading} className="action-button">
                    Start Election
                  </button>
                ) : (
                  <button onClick={endElection} disabled={loading} className="action-button">
                    End Election
                  </button>
                )}
                <p>Status: {electionActive ? '🟢 Active' : '🔴 Inactive'}</p>
              </div>

              <div className="candidate-management">
                <h3>Add Candidate</h3>
                <input
                  type="text"
                  value={newCandidateName}
                  onChange={(e) => setNewCandidateName(e.target.value)}
                  placeholder="Candidate name"
                  disabled={electionActive}
                />
                <button 
                  onClick={addCandidate} 
                  disabled={loading || electionActive || !newCandidateName.trim()}
                  className="action-button"
                >
                  Add Candidate
                </button>
              </div>

              <div className="voter-management">
                <h3>Register Voter</h3>
                <input
                  type="text"
                  value={newVoterAddress}
                  onChange={(e) => setNewVoterAddress(e.target.value)}
                  placeholder="Voter address"
                />
                <button 
                  onClick={registerVoter} 
                  disabled={loading || !newVoterAddress.trim()}
                  className="action-button"
                >
                  Register Voter
                </button>
              </div>
            </div>
          )}

          {/* Voting Section */}
          <div className="voting-section">
            <h2>Voting</h2>
            
            {!isRegisteredVoter ? (
              <p className="error-message">
                You are not registered to vote. Please contact the administrator.
              </p>
            ) : hasVoted ? (
              <p className="success-message">
                ✅ You have already voted!
              </p>
            ) : !electionActive ? (
              <p className="info-message">
                Election is not active. Please wait for the administrator to start the election.
              </p>
            ) : (
              <div className="candidates-list">
                <h3>Select a candidate:</h3>
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="candidate-card">
                    <h4>{candidate.name}</h4>
                    <p>Votes: {candidate.voteCount}</p>
                    <button 
                      onClick={() => vote(candidate.id)}
                      disabled={loading}
                      className="vote-button"
                    >
                      Vote for {candidate.name}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="results-section">
            <h2>Results</h2>
            <button onClick={refreshData} className="refresh-button">
              🔄 Refresh Results
            </button>
            
            <div className="results-list">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="result-card">
                  <h4>{candidate.name}</h4>
                  <div className="vote-bar">
                    <div 
                      className="vote-fill" 
                      style={{ 
                        width: candidates.length > 0 ? 
                          `${(candidate.voteCount / Math.max(...candidates.map(c => c.voteCount), 1)) * 100}%` : 
                          '0%' 
                      }}
                    ></div>
                  </div>
                  <p>{candidate.voteCount} votes</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;