# SolarisStrikeGrid Test Suite

This directory contains comprehensive unit tests for the SolarisStrikeGrid smart contract using fhEVM mock mode.

## Test Files

### 1. `SolarisStrikeGrid.basic.test.js`
Basic functionality tests including:
- Contract deployment
- Grid creation with various parameters
- Input validation (entry fees, match counts, durations)
- Grid queries and pagination
- Gas optimization checks

### 2. `SolarisStrikeGrid.encrypted.test.js`
Encrypted prediction tests including:
- Encrypted entry submission with FHE
- Entry payment validation
- Entry adjustments
- Multiple user scenarios
- FHE operations verification (fromExternal, encryption)
- Edge cases (all pick combinations, maximum players)

### 3. `SolarisStrikeGrid.settlement.test.js`
Settlement and rewards tests including:
- Grid locking mechanism
- Decryption request process
- Grid settlement with various outcomes
- Winner identification
- Prize claiming
- Grid cancellation and refunds
- User transaction tracking

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# or if not installed yet
cd /Users/songsu/Desktop/zama/finance-demo-11/SolarisStrikeGrid
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Basic functionality tests only
npm run test:basic

# Encrypted predictions tests only
npm run test:encrypted

# Settlement and rewards tests only
npm run test:settlement

# Verbose output
npm run test:verbose
```

### Run Individual Test Files
```bash
npx hardhat test test/SolarisStrikeGrid.basic.test.js
npx hardhat test test/SolarisStrikeGrid.encrypted.test.js
npx hardhat test test/SolarisStrikeGrid.settlement.test.js
```

## Test Structure

Each test file follows this pattern:

```javascript
const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("Test Suite Name", function () {
  let contract;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    // Verify fhEVM mock mode
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    // Initialize fhEVM CLI API
    await fhevm.initializeCLIApi();

    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy contract
    const Factory = await ethers.getContractFactory("SolarisStrikeGrid");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;
  });

  describe("Feature Category", function () {
    it("should do something", async function () {
      // Test implementation
      expect(something).to.equal(expected);
      console.log("✅ Test passed");
    });
  });
});
```

## Key Testing Patterns

### Creating Encrypted Inputs
```javascript
const encrypted = await fhevm
  .createEncryptedInput(await contract.getAddress(), userAddress)
  .add8(0)  // First pick (0 = Left, 1 = Right)
  .add8(1)  // Second pick
  .add8(0)  // Third pick
  .encrypt();

await contract.submitEntry(
  gridId,
  encrypted.handles[0],
  encrypted.handles[1],
  encrypted.handles[2],
  encrypted.inputProof,
  { value: entryFee }
);
```

### Time Manipulation
```javascript
// Fast forward time
await network.provider.send("evm_increaseTime", [2 * 60 * 60]); // 2 hours
await network.provider.send("evm_mine");
```

### Balance Tracking
```javascript
const balanceBefore = await ethers.provider.getBalance(user.address);
const tx = await contract.claimPrize(gridId);
const receipt = await tx.wait();
const balanceAfter = await ethers.provider.getBalance(user.address);
const gasCost = receipt.gasUsed * receipt.gasPrice;
```

## Test Coverage

The test suite covers:

### ✅ Contract Deployment
- Successful deployment
- Correct constant values
- Initial state

### ✅ Grid Creation
- Valid grid creation
- Entry fee validation (min: 0.001 ETH)
- Match count validation (2-12 matches)
- Duration validation (30 min - 90 days)
- Duplicate grid ID prevention
- Creator tracking

### ✅ Encrypted Predictions
- FHE.fromExternal() operations
- Encrypted pick submission
- Multiple users support
- Entry adjustment before lock
- All pick combinations (0/1 for each match)
- Privacy preservation

### ✅ Grid Locking
- Time-based locking mechanism
- Entry rejection after lock
- Adjustment rejection after lock

### ✅ Settlement Process
- Decryption request
- Result settlement with validation
- Winner identification
- Prize calculation
- Multiple winner scenarios

### ✅ Prize Distribution
- Winner claims
- Non-winner rejection
- Double claim prevention
- Correct prize amounts

### ✅ Cancellation & Refunds
- Grid cancellation by creator
- Refund claims
- Timing restrictions

### ✅ User Transactions
- Transaction history tracking
- Multiple transaction types

### ✅ Edge Cases
- Zero values
- Maximum players
- Rapid sequential operations
- Gas optimization

## Expected Output

Successful test run should show:
```
  SolarisStrikeGrid - Basic Functionality Tests
    Deployment
      ✓ should deploy contract successfully
      ✓ should have correct constants
    Grid Creation
      ✓ should create a grid successfully
      ✓ should reject grid with insufficient entry fee
      ...

  35 passing (10s)
```

## Troubleshooting

### "This test must run in FHEVM mock environment"
- Make sure you're running tests with Hardhat's fhEVM plugin enabled
- Check `hardhat.config.js` for fhEVM configuration

### "Transaction reverted"
- Check that all required parameters are provided
- Verify entry fee is sufficient
- Ensure grid exists and is in correct state

### "Insufficient funds"
- Make sure test accounts have enough ETH for transactions
- Check that entry fee value matches contract requirements

## Notes

- Tests use fhEVM mock mode for encrypted operations
- All encrypted values are simulated but maintain FHE semantics
- Time manipulation affects block.timestamp
- Gas usage is approximate in test environment
- Each test starts with fresh contract deployment

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Use descriptive test names
3. Add console.log statements for success
4. Test both success and failure cases
5. Document any complex test logic
6. Ensure tests are isolated (use beforeEach)
