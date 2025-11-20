// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { externalEuint8 } from "encrypted-types/EncryptedTypes.sol";
import { EthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Solaris Strike Grid v2
 * @notice Permissionless multi-match prediction pool powered by fhEVM 0.9.1
 *         Players submit encrypted picks (Left=0 or Right=1) for each match
 *         Settlement is derived from provable on-chain randomness (blockhash)
 *         Supports 90-day markets with comprehensive query methods
 */
contract SolarisStrikeGrid is EthereumConfig {
    enum Outcome {
        Left,   // 0
        Right   // 1
    }

    struct Match {
        string label;
        uint256 picksLeft;   // Public count of Left picks
        uint256 picksRight;  // Public count of Right picks
    }

    struct Grid {
        bool exists;
        string gridId;
        address creator;
        uint256 entryFee;
        uint256 lockTime;
        uint256 createdAt;
        uint256 prizePool;
        bool cancelled;
        bool decryptionRequested;  // Step 1 completed
        bool settled;              // Step 2 completed
        bool pushAll;
        uint256 winnerCount;
        uint256 totalPlayers;
        Match[] matches;
        uint8[] finalResults;
        address[] players;
    }

    struct Entry {
        bool exists;
        bool claimed;
        uint256 enteredAt;
        uint256 lastAdjustedAt;
        euint8[] encryptedPicks;  // Encrypted picks: 0=Left, 1=Right
    }

    struct UserTransaction {
        string gridId;
        address player;
        uint256 timestamp;
        uint256 entryFee;
        TxType txType;
    }

    enum TxType {
        ENTER,
        ADJUST,
        CLAIM_PRIZE,
        CLAIM_REFUND
    }

    // Storage
    mapping(string => Grid) private grids;
    mapping(string => mapping(address => Entry)) private entries;
    mapping(string => mapping(address => bool)) private winners;  // gridId => player => isWinner
    mapping(address => UserTransaction[]) private userTransactions;
    string[] private gridIds;

    // Constants - Updated to 90 days max
    uint256 public constant MIN_ENTRY_FEE = 0.001 ether;
    uint256 public constant MIN_DURATION = 30 minutes;
    uint256 public constant MAX_DURATION = 90 days;
    uint8 public constant MIN_MATCHES = 2;
    uint8 public constant MAX_MATCHES = 12;

    // Events
    event GridCreated(
        string indexed gridId,
        address indexed creator,
        uint256 entryFee,
        uint256 lockTime,
        uint256 matchCount
    );
    event EntrySubmitted(
        string indexed gridId,
        address indexed player,
        uint256 timestamp
    );
    event EntryAdjusted(
        string indexed gridId,
        address indexed player,
        uint256 timestamp
    );
    event SettlementRequested(
        string indexed gridId,
        bytes32[] ciphertextHandles,
        uint256 timestamp
    );
    event GridSettled(
        string indexed gridId,
        bool pushAll,
        uint256 winnerCount,
        uint256 timestamp
    );
    event GridCancelled(string indexed gridId, uint256 timestamp);
    event PrizeClaimed(
        string indexed gridId,
        address indexed player,
        uint256 amount,
        uint256 timestamp
    );
    event RefundClaimed(
        string indexed gridId,
        address indexed player,
        uint256 amount,
        uint256 timestamp
    );

    // Errors
    error GridExists();
    error GridMissing();
    error InvalidMatches();
    error InvalidFee();
    error InvalidDuration();
    error InvalidPick();
    error AlreadyEntered();
    error EntryNotFound();
    error Locked();
    error NotLocked();
    error DecryptionNotRequested();
    error DecryptionAlreadyRequested();
    error AlreadySettled();
    error NotSettled();
    error NotWinner();
    error AlreadyClaimed();
    error NotRefundable();
    error OnlyCreator();

    /** ========================= GRID CREATION ========================= */

    /**
     * @notice Create a new prediction grid (public, no encryption)
     * @param gridId Unique identifier for the grid
     * @param entryFee Entry fee in wei
     * @param duration Duration until lock time (max 90 days)
     * @param matchLabels Array of match labels
     */
    function createGrid(
        string memory gridId,
        uint256 entryFee,
        uint256 duration,
        string[] memory matchLabels
    ) external {
        if (grids[gridId].exists) revert GridExists();
        if (entryFee < MIN_ENTRY_FEE) revert InvalidFee();
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert InvalidDuration();
        if (matchLabels.length < MIN_MATCHES || matchLabels.length > MAX_MATCHES) {
            revert InvalidMatches();
        }

        Grid storage grid = grids[gridId];
        grid.exists = true;
        grid.gridId = gridId;
        grid.creator = msg.sender;
        grid.entryFee = entryFee;
        grid.lockTime = block.timestamp + duration;
        grid.createdAt = block.timestamp;

        for (uint256 i = 0; i < matchLabels.length; i++) {
            Match memory matchInfo = Match({
                label: matchLabels[i],
                picksLeft: 0,
                picksRight: 0
            });
            grid.matches.push(matchInfo);
        }

        gridIds.push(gridId);
        emit GridCreated(gridId, msg.sender, entryFee, grid.lockTime, matchLabels.length);
    }

    /** ========================= PARTICIPATION ========================= */

    /**
     * @notice Enter a grid with encrypted picks
     * @param gridId Grid identifier
     * @param encryptedPicks Array of encrypted picks (0=Left, 1=Right)
     */
    function enterGrid(
        string memory gridId,
        externalEuint8[] calldata encryptedPicks,
        bytes calldata inputProof
    ) external payable {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();
        if (grid.cancelled) revert Locked();
        if (block.timestamp >= grid.lockTime) revert Locked();
        if (encryptedPicks.length != grid.matches.length) revert InvalidPick();
        if (msg.value != grid.entryFee) revert InvalidFee();

        Entry storage entry = entries[gridId][msg.sender];
        if (entry.exists) revert AlreadyEntered();

        // Convert and store encrypted picks
        for (uint256 i = 0; i < encryptedPicks.length; i++) {
            euint8 pick = FHE.fromExternal(encryptedPicks[i], inputProof);
            entry.encryptedPicks.push(pick);
            FHE.allow(pick, address(this));
            FHE.allow(pick, msg.sender);
        }

        entry.exists = true;
        entry.claimed = false;
        entry.enteredAt = block.timestamp;
        entry.lastAdjustedAt = block.timestamp;

        grid.prizePool += msg.value;
        grid.players.push(msg.sender);
        grid.totalPlayers += 1;

        // Record transaction
        userTransactions[msg.sender].push(UserTransaction({
            gridId: gridId,
            player: msg.sender,
            timestamp: block.timestamp,
            entryFee: grid.entryFee,
            txType: TxType.ENTER
        }));

        emit EntrySubmitted(gridId, msg.sender, block.timestamp);
    }

    /**
     * @notice Adjust existing entry with new encrypted picks
     * @param gridId Grid identifier
     * @param newEncryptedPicks New array of encrypted picks
     */
    function adjustEntry(
        string memory gridId,
        externalEuint8[] calldata newEncryptedPicks,
        bytes calldata inputProof
    ) external {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();
        if (grid.cancelled) revert Locked();
        if (block.timestamp >= grid.lockTime) revert Locked();
        if (newEncryptedPicks.length != grid.matches.length) revert InvalidPick();

        Entry storage entry = entries[gridId][msg.sender];
        if (!entry.exists) revert EntryNotFound();

        // Clear old encrypted picks
        delete entry.encryptedPicks;

        // Store new encrypted picks
        for (uint256 i = 0; i < newEncryptedPicks.length; i++) {
            euint8 pick = FHE.fromExternal(newEncryptedPicks[i], inputProof);
            entry.encryptedPicks.push(pick);
            FHE.allow(pick, address(this));
            FHE.allow(pick, msg.sender);
        }

        entry.lastAdjustedAt = block.timestamp;
        entry.claimed = false;

        // Record transaction
        userTransactions[msg.sender].push(UserTransaction({
            gridId: gridId,
            player: msg.sender,
            timestamp: block.timestamp,
            entryFee: 0,
            txType: TxType.ADJUST
        }));

        emit EntryAdjusted(gridId, msg.sender, block.timestamp);
    }

    /** ========================= SETTLEMENT ========================= */

    /**
     * @notice Step 1: Request settlement - generate results and mark picks for decryption
     * @param gridId Grid identifier
     * @dev This function generates random results and makes all encrypted picks publicly decryptable
     *      Anyone can call this after lock time. Off-chain, use Gateway to decrypt the picks.
     */
    function requestSettlement(string memory gridId) external {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();
        if (grid.cancelled) revert Locked();
        if (block.timestamp < grid.lockTime) revert NotLocked();
        if (grid.decryptionRequested) revert DecryptionAlreadyRequested();

        // Generate results from blockhash
        uint8[] memory results = new uint8[](grid.matches.length);
        for (uint256 i = 0; i < grid.matches.length; i++) {
            bytes32 rand = keccak256(abi.encode(
                blockhash(block.number - 1),
                gridId,
                i
            ));
            results[i] = uint8(uint256(rand) % 2);
        }

        grid.finalResults = results;

        // Make all encrypted picks publicly decryptable
        // Collect all ciphertext handles for the event
        uint256 totalHandles = 0;
        for (uint256 i = 0; i < grid.players.length; i++) {
            Entry storage entry = entries[gridId][grid.players[i]];
            totalHandles += entry.encryptedPicks.length;
        }

        bytes32[] memory allHandles = new bytes32[](totalHandles);
        uint256 handleIndex = 0;

        for (uint256 i = 0; i < grid.players.length; i++) {
            Entry storage entry = entries[gridId][grid.players[i]];
            for (uint256 j = 0; j < entry.encryptedPicks.length; j++) {
                euint8 pick = entry.encryptedPicks[j];
                FHE.makePubliclyDecryptable(pick);
                allHandles[handleIndex] = FHE.toBytes32(pick);
                handleIndex++;
            }
        }

        grid.decryptionRequested = true;

        emit SettlementRequested(gridId, allHandles, block.timestamp);
    }

    /**
     * @notice Step 2: Finalize settlement with decrypted picks and proof
     * @param gridId Grid identifier
     * @param decryptedPicks All decrypted picks in order [player0pick0, player0pick1, ..., player1pick0, ...]
     * @param decryptionProof KMS signature proof for the decrypted values
     * @dev The order of decryptedPicks must match the order of handles emitted in SettlementRequested
     */
    function finalizeSettlement(
        string memory gridId,
        uint8[] calldata decryptedPicks,
        bytes calldata decryptionProof
    ) external {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();
        if (!grid.decryptionRequested) revert DecryptionNotRequested();
        if (grid.settled) revert AlreadySettled();

        // Reconstruct the handles array in the same order
        uint256 totalHandles = 0;
        for (uint256 i = 0; i < grid.players.length; i++) {
            Entry storage entry = entries[gridId][grid.players[i]];
            totalHandles += entry.encryptedPicks.length;
        }

        require(decryptedPicks.length == totalHandles, "Invalid picks length");

        bytes32[] memory handlesList = new bytes32[](totalHandles);
        uint256 handleIndex = 0;

        for (uint256 i = 0; i < grid.players.length; i++) {
            Entry storage entry = entries[gridId][grid.players[i]];
            for (uint256 j = 0; j < entry.encryptedPicks.length; j++) {
                handlesList[handleIndex] = FHE.toBytes32(entry.encryptedPicks[j]);
                handleIndex++;
            }
        }

        // Verify the decryption proof using FHE.verifySignatures
        bytes memory abiEncodedPicks = abi.encode(decryptedPicks);
        bool isValid = FHE.verifySignatures(handlesList, abiEncodedPicks, decryptionProof);
        require(isValid, "Invalid decryption proof");

        // Now count winners using decrypted picks and store winner status
        uint256 winnerCount = 0;
        uint256 pickIndex = 0;

        for (uint256 i = 0; i < grid.players.length; i++) {
            address player = grid.players[i];
            Entry storage entry = entries[gridId][player];
            bool playerIsWinner = true;

            // Check if all picks match results
            for (uint256 j = 0; j < entry.encryptedPicks.length; j++) {
                if (decryptedPicks[pickIndex] != grid.finalResults[j]) {
                    playerIsWinner = false;
                    break;
                }
                pickIndex++;
            }

            // Store winner status
            winners[gridId][player] = playerIsWinner;

            if (playerIsWinner) {
                winnerCount += 1;
            }
        }

        grid.winnerCount = winnerCount;
        grid.pushAll = (winnerCount == 0);
        grid.settled = true;

        emit GridSettled(gridId, grid.pushAll, winnerCount, block.timestamp);
    }

    /**
     * @notice Cancel a grid (only creator, before settlement)
     * @param gridId Grid identifier
     */
    function cancelGrid(string memory gridId) external {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();
        if (msg.sender != grid.creator) revert OnlyCreator();
        if (grid.settled) revert AlreadySettled();

        grid.cancelled = true;
        emit GridCancelled(gridId, block.timestamp);
    }

    /** ========================= CLAIMS ========================= */

    /**
     * @notice Claim prize for winning entry
     * @param gridId Grid identifier
     */
    function claimPrize(string memory gridId) external {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();
        if (!grid.settled || grid.cancelled || grid.pushAll) revert NotSettled();

        Entry storage entry = entries[gridId][msg.sender];
        if (!entry.exists) revert NotWinner();
        if (entry.claimed) revert AlreadyClaimed();
        if (!winners[gridId][msg.sender]) revert NotWinner();

        uint256 totalWinners = grid.winnerCount;
        require(totalWinners > 0, "No winners");
        uint256 payout = grid.prizePool / totalWinners;

        entry.claimed = true;

        // Record transaction
        userTransactions[msg.sender].push(UserTransaction({
            gridId: gridId,
            player: msg.sender,
            timestamp: block.timestamp,
            entryFee: payout,
            txType: TxType.CLAIM_PRIZE
        }));

        (bool sent, ) = payable(msg.sender).call{ value: payout }("");
        require(sent, "Transfer failed");

        emit PrizeClaimed(gridId, msg.sender, payout, block.timestamp);
    }

    /**
     * @notice Claim refund (cancelled or pushAll)
     * @param gridId Grid identifier
     */
    function claimRefund(string memory gridId) external {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();

        Entry storage entry = entries[gridId][msg.sender];
        if (!entry.exists) revert NotRefundable();
        if (entry.claimed) revert AlreadyClaimed();

        bool refundable = grid.cancelled || (grid.settled && grid.pushAll);
        if (!refundable) revert NotRefundable();

        entry.claimed = true;

        // Record transaction
        userTransactions[msg.sender].push(UserTransaction({
            gridId: gridId,
            player: msg.sender,
            timestamp: block.timestamp,
            entryFee: grid.entryFee,
            txType: TxType.CLAIM_REFUND
        }));

        (bool sent, ) = payable(msg.sender).call{ value: grid.entryFee }("");
        require(sent, "Refund failed");

        emit RefundClaimed(gridId, msg.sender, grid.entryFee, block.timestamp);
    }

    /** ========================= QUERY METHODS ========================= */

    /**
     * @notice List all grid IDs
     */
    function listGrids() external view returns (string[] memory) {
        return gridIds;
    }

    /**
     * @notice Get grid count
     */
    function getGridCount() external view returns (uint256) {
        return gridIds.length;
    }

    /**
     * @notice Get detailed grid information
     */
    function getGrid(string memory gridId)
        external
        view
        returns (
            address creator,
            uint256 entryFee,
            uint256 lockTime,
            uint256 createdAt,
            uint256 prizePool,
            bool cancelled,
            bool settled,
            bool pushAll,
            uint256 winnerCount,
            uint256 totalPlayers
        )
    {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();

        return (
            grid.creator,
            grid.entryFee,
            grid.lockTime,
            grid.createdAt,
            grid.prizePool,
            grid.cancelled,
            grid.settled,
            grid.pushAll,
            grid.winnerCount,
            grid.totalPlayers
        );
    }

    /**
     * @notice Get all matches for a grid
     */
    function getMatches(string memory gridId)
        external
        view
        returns (Match[] memory)
    {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();
        return grid.matches;
    }

    /**
     * @notice Get final results for a settled grid
     */
    function getFinalResults(string memory gridId)
        external
        view
        returns (uint8[] memory)
    {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();
        if (!grid.settled) revert NotSettled();
        return grid.finalResults;
    }

    /**
     * @notice Get all players in a grid
     */
    function getPlayers(string memory gridId)
        external
        view
        returns (address[] memory)
    {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();
        return grid.players;
    }

    /**
     * @notice Check if user has entered a grid
     */
    function hasEntered(string memory gridId, address user)
        external
        view
        returns (bool)
    {
        return entries[gridId][user].exists;
    }

    /**
     * @notice Get user entry information
     */
    function getUserEntry(string memory gridId, address user)
        external
        view
        returns (
            bool exists,
            bool claimed,
            uint256 enteredAt,
            uint256 lastAdjustedAt,
            uint256 picksCount
        )
    {
        Entry storage entry = entries[gridId][user];
        return (
            entry.exists,
            entry.claimed,
            entry.enteredAt,
            entry.lastAdjustedAt,
            entry.encryptedPicks.length
        );
    }

    /**
     * @notice Get user's encrypted picks (only callable by user)
     */
    function getMyEncryptedPicks(string memory gridId)
        external
        view
        returns (euint8[] memory)
    {
        Entry storage entry = entries[gridId][msg.sender];
        if (!entry.exists) revert EntryNotFound();
        return entry.encryptedPicks;
    }

    /**
     * @notice Get all transactions for a user
     */
    function getUserTransactions(address user)
        external
        view
        returns (UserTransaction[] memory)
    {
        return userTransactions[user];
    }

    /**
     * @notice Get transaction count for a user
     */
    function getUserTransactionCount(address user)
        external
        view
        returns (uint256)
    {
        return userTransactions[user].length;
    }

    /**
     * @notice Get paginated user transactions
     */
    function getUserTransactionsPaginated(
        address user,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (UserTransaction[] memory)
    {
        UserTransaction[] storage allTxs = userTransactions[user];
        uint256 totalTxs = allTxs.length;

        if (offset >= totalTxs) {
            return new UserTransaction[](0);
        }

        uint256 endIndex = offset + limit;
        if (endIndex > totalTxs) {
            endIndex = totalTxs;
        }

        uint256 resultLength = endIndex - offset;
        UserTransaction[] memory result = new UserTransaction[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = allTxs[offset + i];
        }

        return result;
    }

    /**
     * @notice Get all grids created by an address
     */
    function getGridsByCreator(address creator)
        external
        view
        returns (string[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < gridIds.length; i++) {
            if (grids[gridIds[i]].creator == creator) {
                count++;
            }
        }

        string[] memory result = new string[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < gridIds.length; i++) {
            if (grids[gridIds[i]].creator == creator) {
                result[index] = gridIds[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Get all grids a user has entered
     */
    function getGridsByPlayer(address player)
        external
        view
        returns (string[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < gridIds.length; i++) {
            if (entries[gridIds[i]][player].exists) {
                count++;
            }
        }

        string[] memory result = new string[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < gridIds.length; i++) {
            if (entries[gridIds[i]][player].exists) {
                result[index] = gridIds[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Check if a user is a winner (after settlement)
     */
    function isWinner(string memory gridId, address user)
        external
        view
        returns (bool)
    {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();
        if (!grid.settled) revert NotSettled();

        return winners[gridId][user];
    }

    /**
     * @notice Get grid statistics
     */
    function getGridStats(string memory gridId)
        external
        view
        returns (
            uint256 totalPlayers,
            uint256 prizePool,
            uint256 matchCount,
            uint256 timeUntilLock,
            bool isActive
        )
    {
        Grid storage grid = grids[gridId];
        if (!grid.exists) revert GridMissing();

        uint256 timeRemaining = 0;
        if (block.timestamp < grid.lockTime) {
            timeRemaining = grid.lockTime - block.timestamp;
        }

        bool active = !grid.cancelled && !grid.settled && block.timestamp < grid.lockTime;

        return (
            grid.totalPlayers,
            grid.prizePool,
            grid.matches.length,
            timeRemaining,
            active
        );
    }

    /** ========================= INTERNAL HELPERS ========================= */

    /**
     * @dev Check if a specific player is a winner by comparing decrypted picks with results
     * @param gridId Grid identifier
     * @param player Player address
     * @param decryptedPicks All decrypted picks for this player
     * @param results The final results
     * @return bool True if all picks match results
     */
    function _checkWinner(
        string memory gridId,
        address player,
        uint8[] memory decryptedPicks,
        uint8[] memory results
    )
        internal
        view
        returns (bool)
    {
        Entry storage entry = entries[gridId][player];
        if (!entry.exists) return false;
        if (decryptedPicks.length != results.length) return false;

        for (uint256 i = 0; i < results.length; i++) {
            if (decryptedPicks[i] != results[i]) {
                return false;
            }
        }

        return true;
    }
}
