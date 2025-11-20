const hre = require("hardhat");

async function main() {
  const contractAddress = "0xf80B6526C677D75c07457243d2c83f05ac85d62A";

  console.log("Checking grids on:", contractAddress);

  const SolarisStrikeGrid = await hre.ethers.getContractAt(
    "SolarisStrikeGrid",
    contractAddress
  );

  const gridIds = [
    "EPL-Week-15",
    "NBA-Finals-G1",
    "UCL-Round-16",
    "Test-Grid-Short"
  ];

  for (const gridId of gridIds) {
    try {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Grid: ${gridId}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Get grid info
      const gridCount = await SolarisStrikeGrid.getGridCount();
      console.log(`Total grids in contract: ${gridCount}`);

      // Try to get grid stats
      try {
        const stats = await SolarisStrikeGrid.getGridStats(gridId);
        console.log(`Total Players: ${stats.totalPlayers}`);
        console.log(`Prize Pool: ${hre.ethers.formatEther(stats.prizePool)} ETH`);
        console.log(`Match Count: ${stats.matchCount}`);
        console.log(`Time Until Lock: ${stats.timeUntilLock} seconds`);
        console.log(`Is Active: ${stats.isActive}`);

        const lockTime = new Date(Date.now() + Number(stats.timeUntilLock) * 1000);
        console.log(`Lock Time: ${lockTime.toLocaleString()}`);
      } catch (e) {
        console.log("⚠️  Grid not found or error:", e.message);
      }

    } catch (error) {
      console.error(`Error checking ${gridId}:`, error.message);
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Check complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
