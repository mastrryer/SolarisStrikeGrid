// Solaris Strike Grid contract configuration
const DEPLOYED_ADDRESS = "0xf80B6526C677D75c07457243d2c83f05ac85d62A" as const; // Deployed on Sepolia with Gateway support
const envAddress = (import.meta as any).env?.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined;

export const SOLARIS_STRIKE_GRID_ADDRESS =
  envAddress && envAddress.startsWith("0x")
    ? envAddress
    : (DEPLOYED_ADDRESS as `0x${string}`);

// Contract ABI - Updated for SolarisStrikeGrid v2
export const SOLARIS_STRIKE_GRID_ABI = [
  // ========== Grid Creation ==========
  {
    name: "createGrid",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "gridId", type: "string", internalType: "string" },
      { name: "entryFee", type: "uint256", internalType: "uint256" },
      { name: "duration", type: "uint256", internalType: "uint256" },
      { name: "matchLabels", type: "string[]", internalType: "string[]" },
    ],
    outputs: [],
  },

  {
    name: "cancelGrid",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "gridId", type: "string", internalType: "string" }],
    outputs: [],
  },

  // ========== Participation ==========
  {
    name: "enterGrid",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "gridId", type: "string", internalType: "string" },
      { name: "encryptedPicks", type: "bytes32[]", internalType: "externalEuint8[]" },
      { name: "inputProof", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
  },

  {
    name: "adjustEntry",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "gridId", type: "string", internalType: "string" },
      {
        name: "newEncryptedPicks",
        type: "bytes32[]",
        internalType: "externalEuint8[]",
      },
      { name: "inputProof", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
  },

  // ========== Settlement (Two-Step Process) ==========
  {
    name: "requestSettlement",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "gridId", type: "string", internalType: "string" }],
    outputs: [],
  },

  {
    name: "finalizeSettlement",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "gridId", type: "string", internalType: "string" },
      { name: "decryptedPicks", type: "uint8[]", internalType: "uint8[]" },
      { name: "decryptionProof", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
  },

  // ========== Claims ==========
  {
    name: "claimPrize",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "gridId", type: "string", internalType: "string" }],
    outputs: [],
  },

  {
    name: "claimRefund",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "gridId", type: "string", internalType: "string" }],
    outputs: [],
  },

  // ========== Query Methods ==========
  {
    name: "listGrids",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string[]", internalType: "string[]" }],
  },

  {
    name: "getGridCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },

  {
    name: "getGrid",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "gridId", type: "string", internalType: "string" }],
    outputs: [
      { name: "creator", type: "address", internalType: "address" },
      { name: "entryFee", type: "uint256", internalType: "uint256" },
      { name: "lockTime", type: "uint256", internalType: "uint256" },
      { name: "createdAt", type: "uint256", internalType: "uint256" },
      { name: "prizePool", type: "uint256", internalType: "uint256" },
      { name: "cancelled", type: "bool", internalType: "bool" },
      { name: "settled", type: "bool", internalType: "bool" },
      { name: "pushAll", type: "bool", internalType: "bool" },
      { name: "winnerCount", type: "uint256", internalType: "uint256" },
      { name: "totalPlayers", type: "uint256", internalType: "uint256" },
    ],
  },

  {
    name: "getMatches",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "gridId", type: "string", internalType: "string" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct SolarisStrikeGrid.Match[]",
        components: [
          { name: "label", type: "string", internalType: "string" },
          { name: "picksLeft", type: "uint256", internalType: "uint256" },
          { name: "picksRight", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
  },

  {
    name: "getFinalResults",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "gridId", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "uint8[]", internalType: "uint8[]" }],
  },

  {
    name: "getPlayers",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "gridId", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
  },

  {
    name: "hasEntered",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "gridId", type: "string", internalType: "string" },
      { name: "user", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },

  {
    name: "getUserEntry",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "gridId", type: "string", internalType: "string" },
      { name: "user", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "exists", type: "bool", internalType: "bool" },
      { name: "claimed", type: "bool", internalType: "bool" },
      { name: "enteredAt", type: "uint256", internalType: "uint256" },
      { name: "lastAdjustedAt", type: "uint256", internalType: "uint256" },
      { name: "picksCount", type: "uint256", internalType: "uint256" },
    ],
  },

  {
    name: "getMyEncryptedPicks",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "gridId", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "bytes32[]", internalType: "euint8[]" }],
  },

  {
    name: "getUserTransactions",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct SolarisStrikeGrid.UserTransaction[]",
        components: [
          { name: "gridId", type: "string", internalType: "string" },
          { name: "player", type: "address", internalType: "address" },
          { name: "timestamp", type: "uint256", internalType: "uint256" },
          { name: "entryFee", type: "uint256", internalType: "uint256" },
          {
            name: "txType",
            type: "uint8",
            internalType: "enum SolarisStrikeGrid.TxType",
          },
        ],
      },
    ],
  },

  {
    name: "getUserTransactionCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },

  {
    name: "getUserTransactionsPaginated",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "offset", type: "uint256", internalType: "uint256" },
      { name: "limit", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct SolarisStrikeGrid.UserTransaction[]",
        components: [
          { name: "gridId", type: "string", internalType: "string" },
          { name: "player", type: "address", internalType: "address" },
          { name: "timestamp", type: "uint256", internalType: "uint256" },
          { name: "entryFee", type: "uint256", internalType: "uint256" },
          {
            name: "txType",
            type: "uint8",
            internalType: "enum SolarisStrikeGrid.TxType",
          },
        ],
      },
    ],
  },

  {
    name: "getGridsByCreator",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "string[]", internalType: "string[]" }],
  },

  {
    name: "getGridsByPlayer",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "string[]", internalType: "string[]" }],
  },

  {
    name: "isWinner",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "gridId", type: "string", internalType: "string" },
      { name: "user", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },

  {
    name: "getGridStats",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "gridId", type: "string", internalType: "string" }],
    outputs: [
      { name: "totalPlayers", type: "uint256", internalType: "uint256" },
      { name: "prizePool", type: "uint256", internalType: "uint256" },
      { name: "matchCount", type: "uint256", internalType: "uint256" },
      { name: "timeUntilLock", type: "uint256", internalType: "uint256" },
      { name: "isActive", type: "bool", internalType: "bool" },
    ],
  },

  // ========== Events ==========
  {
    name: "GridCreated",
    type: "event",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "gridId",
        type: "string",
        internalType: "string",
      },
      {
        indexed: true,
        name: "creator",
        type: "address",
        internalType: "address",
      },
      {
        indexed: false,
        name: "entryFee",
        type: "uint256",
        internalType: "uint256",
      },
      {
        indexed: false,
        name: "lockTime",
        type: "uint256",
        internalType: "uint256",
      },
      {
        indexed: false,
        name: "matchCount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },

  {
    name: "EntrySubmitted",
    type: "event",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "gridId",
        type: "string",
        internalType: "string",
      },
      {
        indexed: true,
        name: "player",
        type: "address",
        internalType: "address",
      },
      {
        indexed: false,
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },

  {
    name: "GridSettled",
    type: "event",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "gridId",
        type: "string",
        internalType: "string",
      },
      {
        indexed: false,
        name: "pushAll",
        type: "bool",
        internalType: "bool",
      },
      {
        indexed: false,
        name: "winnerCount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        indexed: false,
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },

  {
    name: "PrizeClaimed",
    type: "event",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "gridId",
        type: "string",
        internalType: "string",
      },
      {
        indexed: true,
        name: "player",
        type: "address",
        internalType: "address",
      },
      {
        indexed: false,
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        indexed: false,
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
] as const;

// Constants
export const MIN_ENTRY_FEE = 0.001; // ETH
export const MIN_DURATION = 30 * 60; // 30 minutes in seconds
export const MAX_DURATION = 90 * 24 * 60 * 60; // 90 days in seconds
export const MIN_MATCHES = 2;
export const MAX_MATCHES = 12;

// Transaction Types
export enum TxType {
  ENTER = 0,
  ADJUST = 1,
  CLAIM_PRIZE = 2,
  CLAIM_REFUND = 3,
}

export const TxTypeLabels = {
  [TxType.ENTER]: "ENTER",
  [TxType.ADJUST]: "ADJUST",
  [TxType.CLAIM_PRIZE]: "CLAIM PRIZE",
  [TxType.CLAIM_REFUND]: "CLAIM REFUND",
} as const;
