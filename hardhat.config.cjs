/**
 * Hardhat Configuration for Ganache and Localhost
 */
require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    ganache: {
      type: "http",
      url: process.env.REACT_APP_GANACHE_RPC || process.env.VITE_GANACHE_RPC || "http://127.0.0.1:7545",
      chainId: 1337,
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
