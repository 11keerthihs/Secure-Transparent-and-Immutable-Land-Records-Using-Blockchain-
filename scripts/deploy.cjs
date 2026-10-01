const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { exportAbi } = require("./export-abi.cjs");

async function main() {
  console.log("-----------------------------------------------------");
  console.log("Deploying LandRegistry Smart Contract to network...");

  const [deployer] = await ethers.getSigners();
  if (deployer) {
    console.log("Deployer account:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
  }

  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();
  console.log("LandRegistry deployed successfully at:", contractAddress);

  // Write address to src/blockchain/address.json
  const addressPath = path.join(__dirname, "../src/blockchain/address.json");
  const addressDir = path.dirname(addressPath);

  if (!fs.existsSync(addressDir)) {
    fs.mkdirSync(addressDir, { recursive: true });
  }

  const addressData = {
    LandRegistry: contractAddress,
    network: "ganache",
    chainId: 1337,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(addressPath, JSON.stringify(addressData, null, 2));
  console.log("Updated contract address saved to:", addressPath);

  // Automatically export ABI as well
  try {
    exportAbi();
  } catch (err) {
    console.warn("Notice: ABI export skipped or completed with warning:", err.message);
  }

  console.log("-----------------------------------------------------");
  console.log("Deployment complete! Start your React app with: npm start");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
