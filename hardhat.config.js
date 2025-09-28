require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

console.log("Private key length:", process.env.PRIVATE_KEY?.length);
console.log("Private key starts with 0x:", process.env.PRIVATE_KEY?.startsWith('0x'));

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};