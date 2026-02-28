// scripts/deploy.js
// Run: npx hardhat run scripts/deploy.js --network localhost

const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // ── Election parameters ──────────────────────────────────
  const title       = "Student Council Election 2025";
  const description = "Annual student council election for the academic year 2025-26";

  // Start: now + 1 minute | End: now + 7 days
  const now       = Math.floor(Date.now() / 1000);
  const startTime = now + 60;
  const endTime   = now + 7 * 24 * 60 * 60;

  // ── Deploy ───────────────────────────────────────────────
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(title, description, startTime, endTime);
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("✅ Voting contract deployed to:", contractAddress);
  console.log("   Election:", title);
  console.log("   Start:", new Date(startTime * 1000).toLocaleString());
  console.log("   End:  ", new Date(endTime   * 1000).toLocaleString());

  // ── Update contract.js in frontend automatically ─────────
  const frontendContractPath = path.join(__dirname, "../frontend/src/contract.js");

  if (fs.existsSync(frontendContractPath)) {
    let content = fs.readFileSync(frontendContractPath, "utf8");
    content = content.replace(
      /export const contractAddress = ".*?";/,
      `export const contractAddress = "${contractAddress}";`
    );
    fs.writeFileSync(frontendContractPath, content, "utf8");
    console.log("✅ contract.js updated with new address:", contractAddress);
  } else {
    console.log("⚠️  frontend/src/contract.js not found. Update contractAddress manually.");
    console.log("   Address:", contractAddress);
  }

  // ── Save deployment info ─────────────────────────────────
  const deploymentInfo = {
    network:         hre.network.name,
    contractAddress: contractAddress,
    deployer:        deployer.address,
    deployedAt:      new Date().toISOString(),
    electionTitle:   title,
    startTime:       startTime,
    endTime:         endTime
  };

  fs.writeFileSync(
    path.join(__dirname, "../deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("✅ Deployment info saved to deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
