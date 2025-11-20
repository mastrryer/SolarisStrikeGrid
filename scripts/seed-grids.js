const hre = require("hardhat");

async function main() {
  const contractAddress = "0xf80B6526C677D75c07457243d2c83f05ac85d62A";

  console.log("Seeding test grids to:", contractAddress);

  const SolarisStrikeGrid = await hre.ethers.getContractAt(
    "SolarisStrikeGrid",
    contractAddress
  );

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", signer.address);

  // Test Grid 1: EPL Week 15 (Active - locks in 24 hours)
  const grid1 = {
    gridId: "EPL-Week-15",
    entryFee: hre.ethers.parseEther("0.05"),
    duration: 86400, // 24 hours
    matchLabels: [
      "Manchester City vs Arsenal",
      "Liverpool vs Chelsea",
      "Tottenham vs Newcastle",
      "Manchester United vs Brighton",
      "Aston Villa vs West Ham"
    ]
  };

  // Test Grid 2: NBA Finals (Active - locks in 48 hours)
  const grid2 = {
    gridId: "NBA-Finals-G1",
    entryFee: hre.ethers.parseEther("0.1"),
    duration: 172800, // 48 hours
    matchLabels: [
      "Lakers vs Celtics Q1",
      "Lakers vs Celtics Q2",
      "Lakers vs Celtics Q3",
      "Lakers vs Celtics Q4"
    ]
  };

  // Test Grid 3: Champions League (Active - locks in 12 hours)
  const grid3 = {
    gridId: "UCL-Round-16",
    entryFee: hre.ethers.parseEther("0.02"),
    duration: 43200, // 12 hours
    matchLabels: [
      "Real Madrid vs PSG",
      "Bayern Munich vs Inter Milan",
      "Barcelona vs Napoli"
    ]
  };

  // Test Grid 4: Short test (Locked in 5 minutes for testing)
  const grid4 = {
    gridId: "Test-Grid-Short",
    entryFee: hre.ethers.parseEther("0.01"),
    duration: 300, // 5 minutes
    matchLabels: [
      "Team A vs Team B",
      "Team C vs Team D"
    ]
  };

  // Create grids
  const gridsToCreate = [grid1, grid2, grid3, grid4];

  for (const grid of gridsToCreate) {
    try {
      console.log(`\nCreating grid: ${grid.gridId}`);

      const tx = await SolarisStrikeGrid.createGrid(
        grid.gridId,
        grid.entryFee,
        grid.duration,
        grid.matchLabels
      );

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log(`✅ Grid created successfully in block ${receipt.blockNumber}`);

      // Calculate lock time
      const lockTime = new Date(Date.now() + grid.duration * 1000);
      console.log(`   Lock time: ${lockTime.toLocaleString()}`);
      console.log(`   Entry fee: ${hre.ethers.formatEther(grid.entryFee)} ETH`);
      console.log(`   Matches: ${grid.matchLabels.length}`);

    } catch (error) {
      if (error.message.includes("Grid already exists")) {
        console.log(`⚠️  Grid ${grid.gridId} already exists, skipping...`);
      } else {
        console.error(`❌ Error creating grid ${grid.gridId}:`, error.message);
      }
    }
  }

  console.log("\n✅ Seed complete!");
  console.log("\nCreated grids:");
  console.log("1. EPL-Week-15 (locks in 24h)");
  console.log("2. NBA-Finals-G1 (locks in 48h)");
  console.log("3. UCL-Round-16 (locks in 12h)");
  console.log("4. Test-Grid-Short (locks in 5 min - for testing settlement)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
