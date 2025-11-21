import { useState, useEffect, useCallback } from "react";
import {
  SOLARIS_STRIKE_GRID_ADDRESS,
  SOLARIS_STRIKE_GRID_ABI,
} from "@/config/contracts";
import { encryptPicks, initializeFHE } from "@/lib/fhe";
import { executeTransaction, notifications } from "@/lib/notifications";
import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

// Types
export interface Grid {
  creator: Address;
  entryFee: bigint;
  lockTime: bigint;
  createdAt: bigint;
  prizePool: bigint;
  cancelled: boolean;
  settled: boolean;
  pushAll: boolean;
  winnerCount: bigint;
  totalPlayers: bigint;
}

export interface Match {
  label: string;
  picksLeft: bigint;
  picksRight: bigint;
}

export interface UserTransaction {
  gridId: string;
  player: Address;
  timestamp: bigint;
  entryFee: bigint;
  txType: number;
}

export interface GridStats {
  totalPlayers: bigint;
  prizePool: bigint;
  matchCount: bigint;
  timeUntilLock: bigint;
  isActive: boolean;
}

const RPC_URL =
  (import.meta as any).env?.VITE_PUBLIC_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

const contractConfig = {
  address: SOLARIS_STRIKE_GRID_ADDRESS,
  abi: SOLARIS_STRIKE_GRID_ABI,
} as const;

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useContract() {
  const [account, setAccount] = useState<Address | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Sync wagmi account state into local hook + init FHE
  useEffect(() => {
    if (address) {
      setAccount(address as Address);
      setIsConnected(true);
      if (typeof window.ethereum !== "undefined") {
        initializeFHE(window.ethereum).catch(console.error);
      }
    } else {
      setAccount(null);
      setIsConnected(false);
    }
  }, [address]);

  const connectWallet = useCallback(async () => {
    if (openConnectModal) {
      openConnectModal();
      return;
    }

    if (typeof window.ethereum === "undefined") {
      setError("Please install MetaMask");
      notifications.error("Wallet not found", "Please install MetaMask to continue");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts?.length) {
        setAccount(accounts[0] as Address);
        setIsConnected(true);
        await initializeFHE(window.ethereum);
      }
    } catch (err: any) {
      setError(err.message);
      notifications.error("Connection failed", err.message);
    }
  }, [openConnectModal]);

  // ========== READ OPERATIONS ==========

  const listGrids = useCallback(async (): Promise<string[]> => {
    try {
      const ids = await publicClient.readContract({
        ...contractConfig,
        functionName: "listGrids",
      });
      return ids as string[];
    } catch (err: any) {
      console.error("Failed to list grids:", err);
      return [];
    }
  }, []);

  const getGrid = useCallback(
    async (gridId: string): Promise<Grid | null> => {
      try {
        setIsLoading(true);
        const result = (await publicClient.readContract({
          ...contractConfig,
          functionName: "getGrid",
          args: [gridId],
        })) as [
          Address,
          bigint,
          bigint,
          bigint,
          bigint,
          boolean,
          boolean,
          boolean,
          bigint,
          bigint
        ];

        return {
          creator: result[0],
          entryFee: result[1],
          lockTime: result[2],
          createdAt: result[3],
          prizePool: result[4],
          cancelled: result[5],
          settled: result[6],
          pushAll: result[7],
          winnerCount: result[8],
          totalPlayers: result[9],
        };
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getMatches = useCallback(
    async (gridId: string): Promise<Match[]> => {
      try {
        const matches = (await publicClient.readContract({
          ...contractConfig,
          functionName: "getMatches",
          args: [gridId],
        })) as { label: string; picksLeft: bigint; picksRight: bigint }[];

        return matches.map((match) => ({
          label: match.label,
          picksLeft: BigInt(match.picksLeft),
          picksRight: BigInt(match.picksRight),
        }));
      } catch (err: any) {
        console.error("Failed to get matches:", err);
        return [];
      }
    },
    []
  );

  const getUserTransactions = useCallback(
    async (userAddress?: Address): Promise<UserTransaction[]> => {
      const addr = userAddress || account;
      if (!addr) return [];

      try {
        const txs = (await publicClient.readContract({
          ...contractConfig,
          functionName: "getUserTransactions",
          args: [addr],
        })) as UserTransaction[];

        return txs.map((tx) => ({
          gridId: tx.gridId,
          player: tx.player,
          timestamp: BigInt(tx.timestamp),
          entryFee: BigInt(tx.entryFee),
          txType: Number(tx.txType),
        }));
      } catch (err: any) {
        console.error("Failed to get transactions:", err);
        return [];
      }
    },
    [account]
  );

  const getGridStats = useCallback(
    async (gridId: string): Promise<GridStats | null> => {
      try {
        const stats = (await publicClient.readContract({
          ...contractConfig,
          functionName: "getGridStats",
          args: [gridId],
        })) as [bigint, bigint, bigint, bigint, boolean];

        return {
          totalPlayers: stats[0],
          prizePool: stats[1],
          matchCount: stats[2],
          timeUntilLock: stats[3],
          isActive: stats[4],
        };
      } catch (err: any) {
        console.error("Failed to get grid stats:", err);
        return null;
      }
    },
    []
  );

  const getGridsByPlayer = useCallback(
    async (player?: Address): Promise<string[]> => {
      const target = player || account;
      if (!target) return [];

      try {
        const ids = await publicClient.readContract({
          ...contractConfig,
          functionName: "getGridsByPlayer",
          args: [target],
        });
        return ids as string[];
      } catch (err: any) {
        console.error("Failed to fetch player grids:", err);
        return [];
      }
    },
    [account]
  );

  // ========== WRITE OPERATIONS ==========

  const createGrid = useCallback(
    async (
      gridId: string,
      entryFee: string,
      duration: number,
      matchLabels: string[]
    ): Promise<boolean> => {
      if (!account || !window.ethereum) {
        notifications.error("Please connect wallet");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Convert entryFee to wei
        const entryFeeWei = BigInt(Math.floor(parseFloat(entryFee) * 1e18));

        // Encode function call
        const Web3 = (await import("web3")).default;
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(
          SOLARIS_STRIKE_GRID_ABI as any,
          SOLARIS_STRIKE_GRID_ADDRESS
        );

        const receipt = await executeTransaction(
          () => contract.methods
            .createGrid(gridId, entryFeeWei.toString(), duration, matchLabels)
            .send({ from: account }),
          {
            pending: "Creating grid...",
            success: `Grid "${gridId}" created successfully!`,
            error: "Failed to create grid"
          }
        );

        return receipt !== null;
      } catch (err: any) {
        console.error("Failed to create grid:", err);
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [account]
  );

  const enterGrid = useCallback(
    async (
      gridId: string,
      picks: number[],
      entryFee: string
    ): Promise<boolean> => {
      if (!account || !window.ethereum) {
        notifications.error("Please connect wallet");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log("[Contract] Encrypting picks...");
        notifications.info("Encrypting your picks...", "This may take a moment");

        const { handles, proof } = await encryptPicks(picks, account);

        console.log("[Contract] Submitting entry...");

        const entryFeeWei = BigInt(Math.floor(parseFloat(entryFee) * 1e18));

        const Web3 = (await import("web3")).default;
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(
          SOLARIS_STRIKE_GRID_ABI as any,
          SOLARIS_STRIKE_GRID_ADDRESS
        );

        const receipt = await executeTransaction(
          () => contract.methods.enterGrid(gridId, handles, proof).send({
            from: account,
            value: entryFeeWei.toString(),
          }),
          {
            pending: "Submitting encrypted entry...",
            success: "Entry submitted successfully!",
            error: "Failed to submit entry"
          }
        );

        return receipt !== null;
      } catch (err: any) {
        console.error("Failed to enter grid:", err);
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [account]
  );

  const adjustEntry = useCallback(
    async (gridId: string, newPicks: number[]): Promise<boolean> => {
      if (!account || !window.ethereum) {
        notifications.error("Please connect wallet");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        notifications.info("Encrypting updated picks...");
        const { handles, proof } = await encryptPicks(newPicks, account);

        const Web3 = (await import("web3")).default;
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(
          SOLARIS_STRIKE_GRID_ABI as any,
          SOLARIS_STRIKE_GRID_ADDRESS
        );

        const receipt = await executeTransaction(
          () => contract.methods
            .adjustEntry(gridId, handles, proof)
            .send({ from: account }),
          {
            pending: "Adjusting entry...",
            success: "Entry adjusted successfully!",
            error: "Failed to adjust entry"
          }
        );

        return receipt !== null;
      } catch (err: any) {
        console.error("Failed to adjust entry:", err);
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [account]
  );

  const requestSettlement = useCallback(
    async (gridId: string): Promise<boolean> => {
      if (!account || !window.ethereum) {
        notifications.error("Please connect wallet");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log("[Contract] Requesting settlement for:", gridId);

        const Web3 = (await import("web3")).default;
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(
          SOLARIS_STRIKE_GRID_ABI as any,
          SOLARIS_STRIKE_GRID_ADDRESS
        );

        const receipt = await executeTransaction(
          () => contract.methods
            .requestSettlement(gridId)
            .send({ from: account }),
          {
            pending: "Requesting settlement...",
            success: "Settlement requested! Waiting for decryption...",
            error: "Failed to request settlement"
          }
        );

        return receipt !== null;
      } catch (err: any) {
        console.error("Failed to request settlement:", err);
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [account]
  );

  const finalizeSettlement = useCallback(
    async (
      gridId: string,
      decryptedPicks: number[],
      proof: string
    ): Promise<boolean> => {
      if (!account || !window.ethereum) {
        notifications.error("Please connect wallet");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log("[Contract] Finalizing settlement for:", gridId);
        console.log("[Contract] Decrypted picks count:", decryptedPicks.length);

        const Web3 = (await import("web3")).default;
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(
          SOLARIS_STRIKE_GRID_ABI as any,
          SOLARIS_STRIKE_GRID_ADDRESS
        );

        const receipt = await executeTransaction(
          () => contract.methods
            .finalizeSettlement(gridId, decryptedPicks, proof)
            .send({ from: account }),
          {
            pending: "Finalizing settlement...",
            success: "Settlement completed! Winners can now claim prizes.",
            error: "Failed to finalize settlement"
          }
        );

        return receipt !== null;
      } catch (err: any) {
        console.error("Failed to finalize settlement:", err);
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [account]
  );

  const claimPrize = useCallback(
    async (gridId: string): Promise<boolean> => {
      if (!account || !window.ethereum) {
        notifications.error("Please connect wallet");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        const Web3 = (await import("web3")).default;
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(
          SOLARIS_STRIKE_GRID_ABI as any,
          SOLARIS_STRIKE_GRID_ADDRESS
        );

        const receipt = await executeTransaction(
          () => contract.methods
            .claimPrize(gridId)
            .send({ from: account }),
          {
            pending: "Claiming prize...",
            success: "Prize claimed successfully! 🎉",
            error: "Failed to claim prize"
          }
        );

        return receipt !== null;
      } catch (err: any) {
        console.error("Failed to claim prize:", err);
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [account]
  );

  const claimRefund = useCallback(
    async (gridId: string): Promise<boolean> => {
      if (!account || !window.ethereum) {
        notifications.error("Please connect wallet");
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        const Web3 = (await import("web3")).default;
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(
          SOLARIS_STRIKE_GRID_ABI as any,
          SOLARIS_STRIKE_GRID_ADDRESS
        );

        const receipt = await executeTransaction(
          () => contract.methods
            .claimRefund(gridId)
            .send({ from: account }),
          {
            pending: "Claiming refund...",
            success: "Refund claimed successfully!",
            error: "Failed to claim refund"
          }
        );

        return receipt !== null;
      } catch (err: any) {
        console.error("Failed to claim refund:", err);
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [account]
  );

  return {
    // State
    account,
    isConnected,
    isLoading,
    error,

    // Actions
    connectWallet,

    // Read
    listGrids,
    getGrid,
    getMatches,
    getUserTransactions,
    getGridStats,
    getGridsByPlayer,

    // Write
    createGrid,
    enterGrid,
    adjustEntry,
    requestSettlement,
    finalizeSettlement,
    claimPrize,
    claimRefund,
  };
}
