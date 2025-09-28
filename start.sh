#!/bin/bash

# Decentralized Voting App - Startup Script
echo "🗳️ Starting Decentralized Voting App..."

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 22+ using nvm"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Start Hardhat local network in background
echo "🚀 Starting Hardhat local network..."
npx hardhat node &
HARDHAT_PID=$!

# Wait for Hardhat to start
sleep 5

# Deploy contract
echo "📦 Deploying smart contract..."
npx hardhat run scripts/deploy.js --network localhost

# Start React frontend
echo "🌐 Starting React frontend..."
cd frontend
npm start &
REACT_PID=$!

echo ""
echo "🎉 Application is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "⛓️  Blockchain: http://localhost:8545"
echo ""
echo "📋 Setup Instructions:"
echo "1. Install MetaMask browser extension"
echo "2. Add network: http://localhost:8545 (Chain ID: 31337)"
echo "3. Import test account from Hardhat output"
echo "4. Connect wallet in the frontend"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait $REACT_PID

# Cleanup
echo "🛑 Stopping services..."
kill $HARDHAT_PID 2>/dev/null
kill $REACT_PID 2>/dev/null
echo "✅ All services stopped"
