const fs = require("fs");
const path = require("path");

function exportAbi() {
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/LandRegistry.sol/LandRegistry.json"
  );

  const destinationDir = path.join(__dirname, "../src/blockchain");
  const destinationFile = path.join(destinationDir, "LandRegistry.abi.json");

  if (!fs.existsSync(artifactPath)) {
    console.warn("Artifact file not found at " + artifactPath + ". Run 'npm run compile:contracts' first.");
    return false;
  }

  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  fs.writeFileSync(destinationFile, JSON.stringify(artifact.abi, null, 2));
  console.log("Exported LandRegistry ABI to: " + destinationFile);
  return true;
}

if (require.main === module) {
  exportAbi();
}

module.exports = { exportAbi };
