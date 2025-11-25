const { expect } = require("chai");
const { ethers, fhevm, network } = require("hardhat");

describe("SolarisStrikeGrid - Settlement and Rewards Tests", function () {
  let contract;
  let owner, user1, user2, user3;
  const GRID_ID = "Settlement-Test-Grid";
  const ENTRY_FEE = ethers.parseEther("0.01");

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

    // Create a test grid with short duration
    await contract.createGrid(
      GRID_ID,
      ENTRY_FEE,
      60 * 60, // 1 hour
      ["Match A", "Match B", "Match C"]
    );
  });

  describe("Grid Locking", function () {
    it("should allow entries before lock time", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(0)
        .add8(1)
        .add8(0)
        .encrypt();

      await contract.connect(user1).submitEntry(
        GRID_ID,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.inputProof,
        { value: ENTRY_FEE }
      );

      const stats = await contract.getGridStats(GRID_ID);
      expect(stats.totalPlayers).to.equal(1);
      console.log("✅ Entry allowed before lock time");
    });

    it("should reject entries after lock time", async function () {
      // Fast forward time past lock time
      await network.provider.send("evm_increaseTime", [2 * 60 * 60]); // 2 hours
      await network.provider.send("evm_mine");

      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(0)
        .add8(1)
        .add8(0)
        .encrypt();

      await expect(
        contract.connect(user1).submitEntry(
          GRID_ID,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.inputProof,
          { value: ENTRY_FEE }
        )
      ).to.be.reverted;

      console.log("✅ Entry rejected after lock time");
    });

    it("should reject adjustments after lock time", async function () {
      // Submit entry before lock
      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(0)
        .add8(1)
        .add8(0)
        .encrypt();

      await contract.connect(user1).submitEntry(
        GRID_ID,
        encrypted1.handles[0],
        encrypted1.handles[1],
        encrypted1.handles[2],
        encrypted1.inputProof,
        { value: ENTRY_FEE }
      );

      // Fast forward time past lock time
      await network.provider.send("evm_increaseTime", [2 * 60 * 60]);
      await network.provider.send("evm_mine");

      // Try to adjust
      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(1)
        .add8(0)
        .add8(1)
        .encrypt();

      await expect(
        contract.connect(user1).adjustEntry(
          GRID_ID,
          encrypted2.handles[0],
          encrypted2.handles[1],
          encrypted2.handles[2],
          encrypted2.inputProof
        )
      ).to.be.reverted;

      console.log("✅ Adjustment rejected after lock time");
    });
  });

  describe("Decryption Request", function () {
    beforeEach(async function () {
      // Submit some entries
      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(0)
        .add8(1)
        .add8(0)
        .encrypt();

      await contract.connect(user1).submitEntry(
        GRID_ID,
        encrypted1.handles[0],
        encrypted1.handles[1],
        encrypted1.handles[2],
        encrypted1.inputProof,
        { value: ENTRY_FEE }
      );

      // Fast forward past lock time
      await network.provider.send("evm_increaseTime", [2 * 60 * 60]);
      await network.provider.send("evm_mine");
    });

    it("should request decryption after lock time", async function () {
      await contract.requestAllDecryptions(GRID_ID);

      const stats = await contract.getGridStats(GRID_ID);
      // Should mark decryption as requested
      console.log("✅ Decryption requested successfully");
    });

    it("should reject decryption request before lock time", async function () {
      // Create a new grid that hasn't locked yet
      await contract.createGrid(
        "Not-Locked-Grid",
        ENTRY_FEE,
        24 * 60 * 60, // 24 hours
        ["Match A", "Match B"]
      );

      await expect(
        contract.requestAllDecryptions("Not-Locked-Grid")
      ).to.be.reverted;

      console.log("✅ Decryption request rejected before lock time");
    });
  });

  describe("Settlement", function () {
    beforeEach(async function () {
      // Submit entries
      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(0) // Left
        .add8(1) // Right
        .add8(0) // Left
        .encrypt();

      await contract.connect(user1).submitEntry(
        GRID_ID,
        encrypted1.handles[0],
        encrypted1.handles[1],
        encrypted1.handles[2],
        encrypted1.inputProof,
        { value: ENTRY_FEE }
      );

      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), user2.address)
        .add8(1) // Right
        .add8(0) // Left
        .add8(1) // Right
        .encrypt();

      await contract.connect(user2).submitEntry(
        GRID_ID,
        encrypted2.handles[0],
        encrypted2.handles[1],
        encrypted2.handles[2],
        encrypted2.inputProof,
        { value: ENTRY_FEE }
      );

      // Fast forward past lock time
      await network.provider.send("evm_increaseTime", [2 * 60 * 60]);
      await network.provider.send("evm_mine");

      // Request decryption
      await contract.requestAllDecryptions(GRID_ID);
    });

    it("should settle grid successfully", async function () {
      // Settle with results: [0, 1, 0] (Left, Right, Left)
      await contract.settleGrid(GRID_ID, [0, 1, 0]);

      const stats = await contract.getGridStats(GRID_ID);
      expect(stats.isActive).to.be.false;

      console.log("✅ Grid settled successfully");
    });

    it("should identify winners correctly", async function () {
      // Settle with results that match user1's picks: [0, 1, 0]
      await contract.settleGrid(GRID_ID, [0, 1, 0]);

      const isWinner1 = await contract.isWinner(GRID_ID, user1.address);
      const isWinner2 = await contract.isWinner(GRID_ID, user2.address);

      expect(isWinner1).to.be.true;
      expect(isWinner2).to.be.false;

      console.log("✅ Winners identified correctly");
    });

    it("should reject settlement with wrong number of results", async function () {
      await expect(
        contract.settleGrid(GRID_ID, [0, 1]) // Only 2 results, need 3
      ).to.be.reverted;

      console.log("✅ Rejected settlement with wrong number of results");
    });

    it("should reject settlement with invalid results", async function () {
      await expect(
        contract.settleGrid(GRID_ID, [0, 2, 0]) // 2 is invalid (only 0 or 1)
      ).to.be.reverted;

      console.log("✅ Rejected settlement with invalid results");
    });
  });

  describe("Prize Claims", function () {
    beforeEach(async function () {
      // Submit entries and settle
      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(0)
        .add8(1)
        .add8(0)
        .encrypt();

      await contract.connect(user1).submitEntry(
        GRID_ID,
        encrypted1.handles[0],
        encrypted1.handles[1],
        encrypted1.handles[2],
        encrypted1.inputProof,
        { value: ENTRY_FEE }
      );

      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), user2.address)
        .add8(1)
        .add8(0)
        .add8(1)
        .encrypt();

      await contract.connect(user2).submitEntry(
        GRID_ID,
        encrypted2.handles[0],
        encrypted2.handles[1],
        encrypted2.handles[2],
        encrypted2.inputProof,
        { value: ENTRY_FEE }
      );

      // Fast forward and settle
      await network.provider.send("evm_increaseTime", [2 * 60 * 60]);
      await network.provider.send("evm_mine");
      await contract.requestAllDecryptions(GRID_ID);
      await contract.settleGrid(GRID_ID, [0, 1, 0]); // User1 wins
    });

    it("should allow winner to claim prize", async function () {
      const balanceBefore = await ethers.provider.getBalance(user1.address);

      const tx = await contract.connect(user1).claimPrize(GRID_ID);
      const receipt = await tx.wait();

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      // Winner should receive the prize (minus gas)
      expect(balanceAfter).to.be.greaterThan(balanceBefore - gasCost);

      console.log("✅ Winner claimed prize successfully");
    });

    it("should reject non-winner prize claim", async function () {
      await expect(
        contract.connect(user2).claimPrize(GRID_ID)
      ).to.be.reverted;

      console.log("✅ Non-winner prize claim rejected");
    });

    it("should reject double claim", async function () {
      // First claim
      await contract.connect(user1).claimPrize(GRID_ID);

      // Try to claim again
      await expect(
        contract.connect(user1).claimPrize(GRID_ID)
      ).to.be.reverted;

      console.log("✅ Double claim rejected");
    });
  });

  describe("Grid Cancellation", function () {
    it("should allow creator to cancel before lock time", async function () {
      await contract.connect(owner).cancelGrid(GRID_ID);

      const stats = await contract.getGridStats(GRID_ID);
      expect(stats.isActive).to.be.false;

      console.log("✅ Grid cancelled successfully");
    });

    it("should allow players to claim refund after cancellation", async function () {
      // Submit entry
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(0)
        .add8(1)
        .add8(0)
        .encrypt();

      await contract.connect(user1).submitEntry(
        GRID_ID,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.inputProof,
        { value: ENTRY_FEE }
      );

      // Cancel grid
      await contract.connect(owner).cancelGrid(GRID_ID);

      // Claim refund
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await contract.connect(user1).claimRefund(GRID_ID);
      const receipt = await tx.wait();
      const balanceAfter = await ethers.provider.getBalance(user1.address);

      const gasCost = receipt.gasUsed * receipt.gasPrice;

      // Should get refund (minus gas)
      expect(balanceAfter).to.be.greaterThan(balanceBefore - gasCost);

      console.log("✅ Refund claimed successfully");
    });

    it("should reject cancellation after lock time", async function () {
      // Fast forward past lock time
      await network.provider.send("evm_increaseTime", [2 * 60 * 60]);
      await network.provider.send("evm_mine");

      await expect(
        contract.connect(owner).cancelGrid(GRID_ID)
      ).to.be.reverted;

      console.log("✅ Cancellation rejected after lock time");
    });
  });

  describe("User Transactions", function () {
    it("should track user transactions correctly", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(0)
        .add8(1)
        .add8(0)
        .encrypt();

      await contract.connect(user1).submitEntry(
        GRID_ID,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.inputProof,
        { value: ENTRY_FEE }
      );

      const txHistory = await contract.getUserTransactions(user1.address);
      expect(txHistory.length).to.equal(1);

      console.log("✅ User transactions tracked correctly");
    });
  });
});
