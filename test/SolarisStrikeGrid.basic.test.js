const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("SolarisStrikeGrid - Basic Functionality Tests", function () {
  let contract;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, user1, user2, user3] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("SolarisStrikeGrid");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;
  });

  describe("Deployment", function () {
    it("should deploy contract successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
      console.log("✅ Contract deployed at:", await contract.getAddress());
    });

    it("should have correct constants", async function () {
      const minEntryFee = await contract.MIN_ENTRY_FEE();
      const minDuration = await contract.MIN_DURATION();
      const maxDuration = await contract.MAX_DURATION();
      const minMatches = await contract.MIN_MATCHES();
      const maxMatches = await contract.MAX_MATCHES();

      expect(minEntryFee).to.equal(ethers.parseEther("0.001"));
      expect(minDuration).to.equal(30 * 60); // 30 minutes
      expect(maxDuration).to.equal(90 * 24 * 60 * 60); // 90 days
      expect(minMatches).to.equal(2);
      expect(maxMatches).to.equal(12);

      console.log("✅ All constants are correctly set");
    });
  });

  describe("Grid Creation", function () {
    it("should create a grid successfully", async function () {
      const gridId = "Test-Grid-1";
      const entryFee = ethers.parseEther("0.01");
      const duration = 24 * 60 * 60; // 24 hours
      const matchLabels = ["Match A", "Match B", "Match C"];

      const tx = await contract.createGrid(
        gridId,
        entryFee,
        duration,
        matchLabels
      );

      await tx.wait();

      const stats = await contract.getGridStats(gridId);
      expect(stats.totalPlayers).to.equal(0);
      expect(stats.matchCount).to.equal(3);
      expect(stats.isActive).to.be.true;

      console.log("✅ Grid created successfully:", gridId);
    });

    it("should reject grid with insufficient entry fee", async function () {
      const gridId = "Test-Grid-Low-Fee";
      const entryFee = ethers.parseEther("0.0001"); // Too low
      const duration = 24 * 60 * 60;
      const matchLabels = ["Match A", "Match B"];

      await expect(
        contract.createGrid(gridId, entryFee, duration, matchLabels)
      ).to.be.reverted;

      console.log("✅ Correctly rejected low entry fee");
    });

    it("should reject grid with too few matches", async function () {
      const gridId = "Test-Grid-Few-Matches";
      const entryFee = ethers.parseEther("0.01");
      const duration = 24 * 60 * 60;
      const matchLabels = ["Match A"]; // Only 1 match

      await expect(
        contract.createGrid(gridId, entryFee, duration, matchLabels)
      ).to.be.reverted;

      console.log("✅ Correctly rejected grid with too few matches");
    });

    it("should reject grid with too many matches", async function () {
      const gridId = "Test-Grid-Many-Matches";
      const entryFee = ethers.parseEther("0.01");
      const duration = 24 * 60 * 60;
      const matchLabels = Array(13).fill("Match"); // 13 matches

      await expect(
        contract.createGrid(gridId, entryFee, duration, matchLabels)
      ).to.be.reverted;

      console.log("✅ Correctly rejected grid with too many matches");
    });

    it("should reject duplicate grid ID", async function () {
      const gridId = "Test-Grid-Duplicate";
      const entryFee = ethers.parseEther("0.01");
      const duration = 24 * 60 * 60;
      const matchLabels = ["Match A", "Match B"];

      // Create first grid
      await contract.createGrid(gridId, entryFee, duration, matchLabels);

      // Try to create duplicate
      await expect(
        contract.createGrid(gridId, entryFee, duration, matchLabels)
      ).to.be.reverted;

      console.log("✅ Correctly rejected duplicate grid ID");
    });

    it("should reject grid with invalid duration", async function () {
      const gridId = "Test-Grid-Bad-Duration";
      const entryFee = ethers.parseEther("0.01");
      const duration = 10 * 60; // 10 minutes (too short)
      const matchLabels = ["Match A", "Match B"];

      await expect(
        contract.createGrid(gridId, entryFee, duration, matchLabels)
      ).to.be.reverted;

      console.log("✅ Correctly rejected invalid duration");
    });
  });

  describe("Grid Queries", function () {
    beforeEach(async function () {
      // Create a test grid
      await contract.createGrid(
        "Query-Test-Grid",
        ethers.parseEther("0.01"),
        24 * 60 * 60,
        ["Match A", "Match B", "Match C"]
      );
    });

    it("should return correct grid count", async function () {
      const count = await contract.getGridCount();
      expect(count).to.equal(1);
      console.log("✅ Grid count:", count.toString());
    });

    it("should return grid stats", async function () {
      const stats = await contract.getGridStats("Query-Test-Grid");

      expect(stats.totalPlayers).to.equal(0);
      expect(stats.prizePool).to.equal(0);
      expect(stats.matchCount).to.equal(3);
      expect(stats.isActive).to.be.true;

      console.log("✅ Grid stats retrieved successfully");
    });

    it("should list all grids", async function () {
      // Create another grid
      await contract.createGrid(
        "Query-Test-Grid-2",
        ethers.parseEther("0.01"),
        24 * 60 * 60,
        ["Match X", "Match Y"]
      );

      const grids = await contract.getAllGrids();
      expect(grids.length).to.equal(2);

      console.log("✅ Listed all grids:", grids.length);
    });

    it("should paginate grids correctly", async function () {
      // Create more grids
      for (let i = 1; i <= 5; i++) {
        await contract.createGrid(
          `Pagination-Grid-${i}`,
          ethers.parseEther("0.01"),
          24 * 60 * 60,
          ["Match A", "Match B"]
        );
      }

      const page1 = await contract.getGridsPaginated(0, 3);
      expect(page1.length).to.equal(3);

      const page2 = await contract.getGridsPaginated(3, 3);
      expect(page2.length).to.be.greaterThan(0);

      console.log("✅ Pagination works correctly");
    });
  });

  describe("Gas Optimization", function () {
    it("should handle grid creation efficiently", async function () {
      const gridId = "Gas-Test-Grid";
      const entryFee = ethers.parseEther("0.01");
      const duration = 24 * 60 * 60;
      const matchLabels = ["Match A", "Match B", "Match C", "Match D", "Match E"];

      const tx = await contract.createGrid(
        gridId,
        entryFee,
        duration,
        matchLabels
      );

      const receipt = await tx.wait();
      console.log("✅ Grid creation gas used:", receipt.gasUsed.toString());

      // Gas should be reasonable (< 500k for grid creation)
      expect(receipt.gasUsed).to.be.lessThan(500000n);
    });
  });
});
