const { execSync } = require("child_process");
const path = require("path");

console.log("=== RESET AND DEPLOY LAND REGISTRY ===");
console.log("1. Cleaning old artifacts...");
try {
  execSync("npx hardhat clean", { stdio: "inherit" });
} catch (err) {
  console.warn("Clean warning:", err.message);
}

console.log("\n2. Compiling Solidity contracts...");
execSync("npx hardhat compile", { stdio: "inherit" });

console.log("\n3. Exporting ABI...");
require("./export-abi.cjs").exportAbi();

console.log("\n4. Deploying to Ganache (127.0.0.1:7545, chainId 1337)...");
try {
  execSync("npx hardhat run scripts/deploy.cjs --network ganache", {
    stdio: "inherit",
  });
  console.log("\nSuccess! Contract recompiled and deployed to Ganache.");
} catch (err) {
  console.error(
    "\nCould not connect to Ganache on 127.0.0.1:7545. Please make sure Ganache is running:\n" +
      "  Run: npm run ganache\n" +
      "Then rerun: npm run reset-and-deploy"
  );
  process.exit(1);
}
