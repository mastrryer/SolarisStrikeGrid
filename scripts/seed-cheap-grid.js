const hre = require("hardhat");

async function main() {
  const contractAddress = "0xf80B6526C677D75c07457243d2c83f05ac85d62A";

  console.log("Creating cheap test grid at:", contractAddress);

  const SolarisStrikeGrid = await hre.ethers.getContractAt(
    "SolarisStrikeGrid",
    contractAddress
  );

  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", signer.address);

  const grid = {
    gridId: "Test-Cheap-Grid",
    entryFee: hre.ethers.parseEther("0.005"),
    duration: 86400, // 24 hours
    matchLabels: [
      "Match A vs B",
      "Match C vs D",
      "Match E vs F"
    ]
  };

  try {
    console.log(`\nCreating grid: ${grid.gridId}`);
    console.log(`Entry fee: ${hre.ethers.formatEther(grid.entryFee)} ETH`);

    const tx = await SolarisStrikeGrid.createGrid(
      grid.gridId,
      grid.entryFee,
      grid.duration,
      grid.matchLabels
    );

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log(`✅ Grid created successfully in block ${receipt.blockNumber}`);

  } catch (error) {
    if (error.message.includes("Grid already exists")) {
      console.log(`⚠️  Grid ${grid.gridId} already exists`);
    } else {
      console.error(`❌ Error:`, error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
