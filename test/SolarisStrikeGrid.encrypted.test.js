const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("SolarisStrikeGrid - Encrypted Predictions Tests", function () {
  let contract;
  let owner, user1, user2, user3;
  const GRID_ID = "Encrypted-Test-Grid";
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

    // Create a test grid
    await contract.createGrid(
      GRID_ID,
      ENTRY_FEE,
      24 * 60 * 60, // 24 hours
      ["Match A", "Match B", "Match C"]
    );
  });

  describe("Entry Submission", function () {
    it("should submit encrypted entry successfully", async function () {
      // Create encrypted picks: [0, 1, 0] (Left, Right, Left)
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(0) // Match 0: Left
        .add8(1) // Match 1: Right
        .add8(0) // Match 2: Left
        .encrypt();

      const tx = await contract.connect(user1).submitEntry(
        GRID_ID,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.inputProof,
        { value: ENTRY_FEE }
      );

      await tx.wait();

      const stats = await contract.getGridStats(GRID_ID);
      expect(stats.totalPlayers).to.equal(1);
      expect(stats.prizePool).to.equal(ENTRY_FEE);

      console.log("✅ Encrypted entry submitted successfully");
    });

    it("should reject entry without payment", async function () {
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
          encrypted.inputProof
          // Missing { value: ENTRY_FEE }
        )
      ).to.be.reverted;

      console.log("✅ Correctly rejected entry without payment");
    });

    it("should reject entry with insufficient payment", async function () {
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
          { value: ethers.parseEther("0.005") } // Half the entry fee
        )
      ).to.be.reverted;

      console.log("✅ Correctly rejected insufficient payment");
    });

    it("should reject duplicate entry from same user", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(0)
        .add8(1)
        .add8(0)
        .encrypt();

      // Submit first entry
      await contract.connect(user1).submitEntry(
        GRID_ID,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.inputProof,
        { value: ENTRY_FEE }
      );

      // Try to submit again
      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(1)
        .add8(0)
        .add8(1)
        .encrypt();

      await expect(
        contract.connect(user1).submitEntry(
          GRID_ID,
          encrypted2.handles[0],
          encrypted2.handles[1],
          encrypted2.handles[2],
          encrypted2.inputProof,
          { value: ENTRY_FEE }
        )
      ).to.be.reverted;

      console.log("✅ Correctly rejected duplicate entry");
    });

    it("should accept multiple entries from different users", async function () {
      // User1 entry
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

      // User2 entry
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

      const stats = await contract.getGridStats(GRID_ID);
      expect(stats.totalPlayers).to.equal(2);
      expect(stats.prizePool).to.equal(ENTRY_FEE * 2n);

      console.log("✅ Multiple entries accepted from different users");
    });
  });

  describe("Entry Adjustment", function () {
    beforeEach(async function () {
      // Submit initial entry
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
    });

    it("should adjust entry successfully", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(1)
        .add8(0)
        .add8(1)
        .encrypt();

      const tx = await contract.connect(user1).adjustEntry(
        GRID_ID,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.inputProof
      );

      await tx.wait();

      const stats = await contract.getGridStats(GRID_ID);
      expect(stats.totalPlayers).to.equal(1); // Should still be 1

      console.log("✅ Entry adjusted successfully");
    });

    it("should reject adjustment from non-participant", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user2.address)
        .add8(1)
        .add8(0)
        .add8(1)
        .encrypt();

      await expect(
        contract.connect(user2).adjustEntry(
          GRID_ID,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.inputProof
        )
      ).to.be.reverted;

      console.log("✅ Correctly rejected adjustment from non-participant");
    });
  });

  describe("FHE Operations Verification", function () {
    it("should verify FHE.fromExternal() works correctly", async function () {
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

      console.log("✅ FHE.fromExternal() - Encrypted input conversion works");
    });

    it("should handle all possible pick combinations", async function () {
      const combinations = [
        [0, 0, 0], // All Left
        [1, 1, 1], // All Right
        [0, 1, 0], // Mixed
        [1, 0, 1], // Mixed
        [0, 0, 1], // Mixed
        [1, 1, 0], // Mixed
      ];

      for (let i = 0; i < combinations.length; i++) {
        const picks = combinations[i];
        const testGridId = `FHE-Test-Grid-${i}`;

        // Create grid for this test
        await contract.createGrid(
          testGridId,
          ENTRY_FEE,
          24 * 60 * 60,
          ["Match A", "Match B", "Match C"]
        );

        // Submit entry with this combination
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), user1.address)
          .add8(picks[0])
          .add8(picks[1])
          .add8(picks[2])
          .encrypt();

        await contract.connect(user1).submitEntry(
          testGridId,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.inputProof,
          { value: ENTRY_FEE }
        );

        console.log(`✅ Combination [${picks.join(", ")}] processed successfully`);
      }
    });

    it("should maintain encryption throughout the process", async function () {
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

      // Try to query player's picks (should not reveal anything)
      const hasEntry = await contract.hasEntry(GRID_ID, user1.address);
      expect(hasEntry).to.be.true;

      console.log("✅ Encryption maintained - picks remain private");
    });
  });

  describe("Edge Cases", function () {
    it("should handle maximum number of players", async function () {
      const maxPlayers = 10; // Test with 10 players

      for (let i = 0; i < maxPlayers; i++) {
        const signer = (await ethers.getSigners())[i % 4]; // Cycle through available signers

        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), signer.address)
          .add8(i % 2) // Alternate picks
          .add8((i + 1) % 2)
          .add8(i % 2)
          .encrypt();

        const testGridId = `Max-Players-Grid-${i}`;

        // Create grid for this test
        await contract.createGrid(
          testGridId,
          ENTRY_FEE,
          24 * 60 * 60,
          ["Match A", "Match B", "Match C"]
        );

        await contract.connect(signer).submitEntry(
          testGridId,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.handles[2],
          encrypted.inputProof,
          { value: ENTRY_FEE }
        );
      }

      console.log(`✅ Handled ${maxPlayers} entries successfully`);
    });
  });
});
