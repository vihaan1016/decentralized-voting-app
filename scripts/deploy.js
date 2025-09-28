const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Voting contract...");

  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("Voting contract deployed to:", contractAddress);
  console.log("Contract owner:", await voting.owner());
  
  // Save contract address to a file for frontend
  const fs = require('fs');
  const contractInfo = {
    address: contractAddress,
    abi: require("../artifacts/contracts/Voting.sol/Voting.json").abi
  };
  
  fs.writeFileSync(
    "../frontend/src/contractInfo.json", 
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("Contract info saved to frontend/src/contractInfo.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
