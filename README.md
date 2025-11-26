# Solaris Strike Grid

<div align="center">

**Privacy-Preserving Prediction Market Platform Built on Zama fhEVM**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![fhEVM](https://img.shields.io/badge/fhEVM-0.9.1-green)](https://docs.zama.ai/fhevm)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

---

## 📖 Overview

Solaris Strike Grid is an innovative on-chain prediction market platform utilizing **Zama fhEVM** (Fully Homomorphic Encryption for EVM) technology to enable completely private prediction submissions. Users can make encrypted predictions on multiple matches, with all choices stored on-chain as ciphertext, remaining invisible to everyone (including the contract creator) until settlement.

### Core Features

- 🔐 **Complete Privacy Protection**: Based on Fully Homomorphic Encryption (FHE) technology, predictions stored as `euint8` ciphertext on-chain
- 🎯 **Multi-Match Predictions**: Each Grid supports combined predictions for 2-12 matches
- 🏆 **Fair Reward Mechanism**: Winners who predict all matches correctly share the prize pool (no platform fees)
- 🔄 **Adjustable Predictions**: Modify your predictions anytime before the grid locks
- 🌐 **Decentralized Settlement**: Asynchronous decryption using Gateway Oracle
- 📊 **Complete Transaction History**: All user transaction history stored on-chain

---

## 🔗 Deployment Information

| Item | Information |
|------|-------------|
| **Contract Address** | `0xf80B6526C677D75c07457243d2c83f05ac85d62A` |
| **Network** | Sepolia Testnet |
| **Block Explorer** | [View on Etherscan](https://sepolia.etherscan.io/address/0xf80B6526C677D75c07457243d2c83f05ac85d62A) |
| **Live Demo** | [https://solaris-strike-grid.vercel.app](https://solaris-strike-grid.vercel.app) |
| **GitHub** | [https://github.com/mastrryer/SolarisStrikeGrid](https://github.com/mastrryer/SolarisStrikeGrid) |

---

## 🎮 How to Use

### 1. Connect Wallet
Connect a Web3 wallet that supports Sepolia testnet (such as MetaMask), ensuring you have enough test ETH for entry fees and gas costs.

### 2. Browse Markets
Visit the Markets page to view all active prediction Grids. Each Grid contains:
- **Match List**: Multiple matches requiring predictions
- **Entry Fee**: ETH amount required to participate
- **Lock Time**: Deadline for submitting predictions
- **Prize Pool**: Currently accumulated prize amount

### 3. Submit Predictions
After selecting a Grid:
1. Choose "Left" or "Right" for each match
2. Your choices are encrypted locally in your browser
3. Pay the entry fee and submit encrypted predictions on-chain
4. Predictions stored as `euint8` ciphertext, invisible to all

### 4. Wait for Settlement
- After the Grid reaches lock time, no new predictions are accepted
- Creator triggers settlement request, Gateway Oracle asynchronously decrypts all predictions
- Contract verifies decryption proof and calculates winners

### 5. Claim Rewards
- If your predictions **completely match all matches**, you're a winner
- Check your winning status on the Dashboard page
- Click "Claim Prize" to receive your share of the prize
- Prize distributed evenly among all winners

---

## 🔐 Privacy Protection Mechanism

### Fully Homomorphic Encryption (FHE) Technology

Solaris Strike Grid uses Zama's fhEVM technology for on-chain privacy protection:

```
User Browser                Smart Contract              Gateway Oracle
    │                           │                               │
    ├─ 1. Local Encryption      │                               │
    │   (euint8[] + proof)      │                               │
    │                           │                               │
    ├─ 2. Submit Ciphertext ──► │                               │
    │                           ├─ Store Encrypted Predictions  │
    │                           │   (invisible to all)          │
    │                           │                               │
    │                           ├─ 3. Grid Locks                │
    │                           │                               │
    │                           ├─ 4. Request Decryption ─────► │
    │                           │                               ├─ 5. Async Decrypt
    │                           │                               │
    │                           │ ◄─── 6. Return Plaintext + Proof ─┤
    │                           │                               │
    │                           ├─ 7. Verify Proof             │
    │                           ├─ 8. Calculate Winners        │
    │                           │                               │
    │ ◄─ 9. Claim Rewards ──────┤                               │
```

### Privacy Guarantees

| Stage | Privacy Status |
|-------|----------------|
| **Pre-Submission** | Locally encrypted, not on-chain |
| **Post-Submission** | On-chain ciphertext storage, invisible to all |
| **Post-Lock** | Still encrypted, awaiting decryption request |
| **During Decryption** | Gateway asynchronously decrypting |
| **Post-Settlement** | Plaintext revealed, calculation complete |

---

## 🏗️ Technical Architecture

### Smart Contract Core

```solidity
// Core Data Structures
struct Grid {
    string gridId;              // Unique Grid identifier
    address creator;            // Creator address
    uint256 entryFee;          // Entry fee (minimum 0.001 ETH)
    uint256 lockTime;          // Lock timestamp
    uint256 duration;          // Duration (30 minutes - 90 days)
    string[] matchLabels;      // Match label list (2-12 matches)
    uint256 prizePool;         // Prize pool amount
    uint256 playerCount;       // Participant count
    bool isActive;             // Is active
    bool isSettled;            // Is settled
}

struct PlayerEntry {
    euint8[] encryptedPicks;   // Encrypted predictions (FHE)
    bool hasEntered;           // Has participated
    bool hasClaimed;           // Has claimed
}
```

### Two-Step Asynchronous Settlement Flow

#### Step 1: Request Decryption (On-Chain)
```solidity
function requestSettlement(string memory gridId) external {
    // 1. Verify Grid status
    require(block.timestamp >= grid.lockTime, "Grid not locked");

    // 2. Generate random results
    uint8[] memory results = _generateResults(matchCount);

    // 3. Mark all encrypted predictions as publicly decryptable
    for (uint256 i = 0; i < playerCount; i++) {
        FHE.makePubliclyDecryptable(encryptedPicks[i]);
    }

    // 4. Emit event with all ciphertext handles
    emit SettlementRequested(gridId, handles, results);
}
```

#### Step 2: Off-Chain Decryption (Gateway Oracle)
```typescript
// Listen for SettlementRequested event
contract.on("SettlementRequested", async (gridId, handles, results) => {
    // Call Gateway to decrypt all ciphertexts
    const { values, proof } = await fhevmInstance.publicDecryptHandles(handles);

    // Submit decryption results and proof
    await contract.finalizeSettlement(gridId, values, proof);
});
```

#### Step 3: Finalize Settlement (On-Chain)
```solidity
function finalizeSettlement(
    string memory gridId,
    uint8[][] memory decryptedPicks,
    bytes memory decryptionProof
) external {
    // 1. Verify decryption proof
    require(FHE.verifySignatures(handles, decryptionProof), "Invalid proof");

    // 2. Calculate winners
    for (uint256 i = 0; i < playerCount; i++) {
        bool isWinner = _checkWinner(decryptedPicks[i], results);
        if (isWinner) {
            winners[gridId][playerAddress] = true;
            winnerCount++;
        }
    }

    // 3. Update Grid status
    grid.isSettled = true;
    emit GridSettled(gridId, winnerCount);
}
```

---

## 🎯 Reward Mechanism

### Prize Pool Composition
- **100% of entry fees go into prize pool**
- No platform fees
- No creator commission

### Winning Conditions
Players must **correctly predict all matches** to win:

```
Example Grid: 3 matches
Actual Results: [Left, Right, Left] = [0, 1, 0]

Player A Prediction: [0, 1, 0] ✅ Perfect Match → Winner
Player B Prediction: [0, 1, 1] ❌ Partial Match → Not Winner
Player C Prediction: [1, 0, 1] ❌ Complete Miss → Not Winner
```

### Distribution Formula

```
Individual Prize = Total Prize Pool ÷ Number of Winners
```

**Example:**
- 10 players participate, entry fee 0.05 ETH each
- Prize Pool: 10 × 0.05 = **0.5 ETH**
- 2 players achieve perfect match
- Each receives: 0.5 ÷ 2 = **0.25 ETH**

### No Winner Scenario
If no player correctly predicts all matches:
- All participants can claim **full refund**
- No one loses principal
- Fair and transparent

---

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity**: ^0.8.24
- **fhEVM**: @fhevm/solidity ^0.9.1
- **Hardhat**: ^2.26.3
- **Network**: Sepolia Testnet

### Frontend Application
- **React**: ^18.3.1
- **TypeScript**: ^5.6.2
- **Vite**: ^6.0.5
- **Wagmi**: ^2.15.2
- **fhevmjs**: ^0.9.1
- **Tailwind CSS**: ^3.4.17
- **Framer Motion**: ^11.15.0

### Testing Framework
- **Chai**: ^4.3.6
- **Ethers.js**: ^6.13.4
- **Hardhat Test**: fhEVM Mock Mode

---

## 📦 Quick Start

### Requirements
- Node.js >= 18
- npm >= 9
- Web3-compatible browser

### 1. Clone Repository
```bash
git clone https://github.com/mastrryer/SolarisStrikeGrid.git
cd SolarisStrikeGrid
```

### 2. Install Dependencies
```bash
# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 3. Configure Environment Variables
```bash
# Create .env file in root directory
cp .env.example .env
```

Edit `.env` file:
```env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_private_key_here
```

### 4. Compile Contracts
```bash
npx hardhat compile
```

### 5. Run Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:basic        # Basic functionality tests
npm run test:encrypted    # Encrypted prediction tests
npm run test:settlement   # Settlement and reward tests
```

### 6. Deploy Contract
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 7. Start Frontend
```bash
cd frontend
npm run dev
```

Visit http://localhost:5173

---

## 🧪 Test Coverage

The project includes a comprehensive unit test suite (35+ test cases):

### Basic Functionality Tests (`test/SolarisStrikeGrid.basic.test.js`)
- ✅ Contract deployment verification
- ✅ Constants configuration checks
- ✅ Grid creation functionality
- ✅ Parameter validation (entry fee, match count, duration)
- ✅ Query functions and pagination
- ✅ Gas optimization checks

### Encrypted Prediction Tests (`test/SolarisStrikeGrid.encrypted.test.js`)
- ✅ FHE encrypted input submission
- ✅ Payment validation
- ✅ Prediction adjustment functionality
- ✅ Multi-user scenarios
- ✅ All prediction combination tests
- ✅ Edge cases (maximum player count)

### Settlement and Reward Tests (`test/SolarisStrikeGrid.settlement.test.js`)
- ✅ Grid locking mechanism
- ✅ Decryption request process
- ✅ Settlement with various outcomes
- ✅ Winner identification
- ✅ Prize claiming (success/failure/double claim)
- ✅ Grid cancellation and refunds

### Running Tests
```bash
npm test                  # All tests
npm run test:basic        # Basic tests
npm run test:encrypted    # Encryption tests
npm run test:settlement   # Settlement tests
npm run test:verbose      # Verbose output
```

---

## 📚 API Documentation

### Core Functions

#### Create Grid
```solidity
function createGrid(
    string memory gridId,
    uint256 entryFee,        // Minimum 0.001 ETH
    uint256 duration,        // 30 minutes - 90 days
    string[] memory matchLabels  // 2-12 matches
) external
```

#### Submit Prediction
```solidity
function submitEntry(
    string memory gridId,
    externalEuint8 memory pick0,
    externalEuint8 memory pick1,
    externalEuint8 memory pick2,
    bytes memory inputProof
) external payable
```

#### Adjust Prediction
```solidity
function adjustEntry(
    string memory gridId,
    externalEuint8 memory pick0,
    externalEuint8 memory pick1,
    externalEuint8 memory pick2,
    bytes memory inputProof
) external
```

#### Request Settlement
```solidity
function requestSettlement(string memory gridId) external
```

#### Finalize Settlement
```solidity
function finalizeSettlement(
    string memory gridId,
    uint8[][] memory decryptedPicks,
    bytes memory decryptionProof
) external
```

#### Claim Prize
```solidity
function claimPrize(string memory gridId) external
```

#### Claim Refund
```solidity
function claimRefund(string memory gridId) external
```

### Query Functions

```solidity
// User-related
function getUserTransactions(address user) external view returns (UserTransaction[] memory)
function getUserTransactionCount(address user) external view returns (uint256)
function getGridsByCreator(address creator) external view returns (string[] memory)
function getGridsByPlayer(address player) external view returns (string[] memory)

// Grid-related
function getGridCount() external view returns (uint256)
function getGridStats(string memory gridId) external view returns (GridStats memory)
function isWinner(string memory gridId, address user) external view returns (bool)
function hasEntry(string memory gridId, address user) external view returns (bool)
```

---

## 🎨 Frontend Integration Example

### Initialize fhEVM
```typescript
import { initFhevm, createFhevmInstance } from 'fhevmjs';

// Initialize fhEVM
await initFhevm();

// Create instance
const instance = await createFhevmInstance({
    chainId: 11155111, // Sepolia
    networkUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    gatewayUrl: 'https://gateway.sepolia.fhevm.io'
});
```

### Submit Encrypted Predictions
```typescript
import { BrowserProvider } from 'ethers';

// Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add8(0); // First match: Left
input.add8(1); // Second match: Right
input.add8(0); // Third match: Left

const encrypted = await input.encrypt();

// Submit to contract
const tx = await contract.submitEntry(
    gridId,
    encrypted.handles[0],
    encrypted.handles[1],
    encrypted.handles[2],
    encrypted.inputProof,
    { value: entryFee }
);

await tx.wait();
```

### Listen for Events
```typescript
// Listen for Grid creation
contract.on("GridCreated", (gridId, creator, entryFee) => {
    console.log(`New grid created: ${gridId}`);
});

// Listen for prediction submissions
contract.on("EntrySubmitted", (gridId, player) => {
    console.log(`Player ${player} entered ${gridId}`);
});

// Listen for settlement requests
contract.on("SettlementRequested", async (gridId, handles, results) => {
    // Trigger off-chain decryption
    const { values, proof } = await instance.publicDecryptHandles(handles);
    await contract.finalizeSettlement(gridId, values, proof);
});

// Listen for settlement completion
contract.on("GridSettled", (gridId, winnerCount) => {
    console.log(`Grid ${gridId} settled with ${winnerCount} winners`);
});
```

---

## 🔒 Security

### Audit Status
- ⏳ Pending third-party security audit
- ✅ Passed unit test coverage
- ✅ Deployed and verified on testnet

### Security Features
- **FHE Encryption**: Predictions stored as ciphertext on-chain
- **Decryption Proof Verification**: Uses `FHE.verifySignatures` for validation
- **Access Control**: `FHE.allow` restricts ciphertext read permissions
- **Reentrancy Protection**: Uses checks-effects-interactions pattern
- **Time Lock Protection**: Predictions cannot be modified after lock

### Known Limitations
- Currently only deployed on testnet
- Gateway decryption depends on off-chain service
- Gas costs may be high (FHE operations)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit code, report issues, or suggest improvements.

### Contribution Process
1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

### Code Standards
- Follow Solidity Style Guide
- Add comprehensive comments
- Ensure all tests pass
- Update relevant documentation

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- [Zama](https://www.zama.ai/) - For providing fhEVM technology
- [Hardhat](https://hardhat.org/) - Smart contract development framework
- [React](https://react.dev/) - Frontend framework
- All contributors and supporters

---

## 📧 Contact

- **GitHub Issues**: [Submit Issue](https://github.com/mastrryer/SolarisStrikeGrid/issues)
- **GitHub Discussions**: [Join Discussion](https://github.com/mastrryer/SolarisStrikeGrid/discussions)

---

<div align="center">

**⭐ If this project helps you, please give us a Star! ⭐**

Made with ❤️ by [mastrryer](https://github.com/mastrryer) & [willithubhaju](https://github.com/willithubhaju)

</div>
