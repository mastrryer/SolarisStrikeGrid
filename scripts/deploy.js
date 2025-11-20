const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying SolarisStrikeGrid contract...");

  const SolarisStrikeGrid = await hre.ethers.getContractFactory("SolarisStrikeGrid");
  const contract = await SolarisStrikeGrid.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`✅ SolarisStrikeGrid deployed to: ${contractAddress}`);

  // Update frontend contract address
  const frontendConstantsPath = path.join(__dirname, "../frontend/src/constants/contracts.ts");
  if (fs.existsSync(frontendConstantsPath)) {
    let content = fs.readFileSync(frontendConstantsPath, "utf8");
    content = content.replace(
      /export const SOLARIS_STRIKE_GRID_ADDRESS = "0x[a-fA-F0-9]{40}"/,
      `export const SOLARIS_STRIKE_GRID_ADDRESS = "${contractAddress}"`
    );
    fs.writeFileSync(frontendConstantsPath, content);
    console.log(`✅ Updated frontend contract address`);
  }

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${(await hre.ethers.getSigners())[0].address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
