import { toast } from "sonner";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

/**
 * Transaction notification helper
 * Provides consistent toast notifications for blockchain transactions
 */

export const txNotifications = {
  /**
   * Show transaction pending notification
   */
  pending: (txHash: string, message: string = "Transaction pending...") => {
    const explorerUrl = `${SEPOLIA_EXPLORER}/tx/${txHash}`;

    return toast.loading(message, {
      description: `Click to view: ${explorerUrl}`,
      duration: Infinity, // Keep showing until we update it
      action: {
        label: "View",
        onClick: () => window.open(explorerUrl, "_blank"),
      },
    });
  },

  /**
   * Update pending toast to success
   */
  success: (
    toastId: string | number,
    txHash: string,
    message: string = "Transaction confirmed!"
  ) => {
    const explorerUrl = `${SEPOLIA_EXPLORER}/tx/${txHash}`;

    toast.success(message, {
      id: toastId,
      description: `Click to view on Etherscan`,
      duration: 6000,
      action: {
        label: "View",
        onClick: () => window.open(explorerUrl, "_blank"),
      },
    });
  },

  /**
   * Update pending toast to error
   */
  error: (
    toastId: string | number,
    txHash: string | null,
    message: string = "Transaction failed"
  ) => {
    const explorerUrl = txHash ? `${SEPOLIA_EXPLORER}/tx/${txHash}` : null;

    toast.error(message, {
      id: toastId,
      description: explorerUrl ? "Click to view on Etherscan" : "Check your wallet for details",
      duration: 8000,
      action: explorerUrl ? {
        label: "View",
        onClick: () => window.open(explorerUrl, "_blank"),
      } : undefined,
    });
  },

  /**
   * Show standalone success notification (without prior pending)
   */
  successStandalone: (txHash: string, message: string) => {
    const explorerUrl = `${SEPOLIA_EXPLORER}/tx/${txHash}`;

    toast.success(message, {
      description: "Click to view on Etherscan",
      duration: 6000,
      action: {
        label: "View",
        onClick: () => window.open(explorerUrl, "_blank"),
      },
    });
  },

  /**
   * Show standalone error notification (without prior pending)
   */
  errorStandalone: (message: string, description?: string) => {
    toast.error(message, {
      description: description || "Please check your wallet and try again",
      duration: 8000,
    });
  },
};

/**
 * Execute a transaction with automatic toast notifications
 * Supports both ethers.js and web3.js transaction formats
 *
 * @param txFn - Function that returns a transaction promise (web3.js PromiEvent or ethers Transaction)
 * @param messages - Custom messages for different states
 * @returns Transaction receipt or null if failed
 */
export async function executeTransaction<T = any>(
  txFn: () => Promise<any>,
  messages?: {
    pending?: string;
    success?: string;
    error?: string;
  }
): Promise<T | null> {
  let toastId: string | number | undefined;
  let txHash: string | undefined;

  try {
    // Send transaction - web3.js returns the receipt directly from .send()
    // with transactionHash property
    const result = await txFn();

    // web3.js: result is the receipt with transactionHash
    // ethers.js: result has hash and wait()
    if (result.transactionHash) {
      // web3.js format - already confirmed
      txHash = result.transactionHash;

      // Show success notification directly
      txNotifications.successStandalone(
        txHash,
        messages?.success || "Transaction confirmed!"
      );

      return result as T;
    } else if (result.hash && typeof result.wait === 'function') {
      // ethers.js format
      txHash = result.hash;

      // Show pending notification
      toastId = txNotifications.pending(
        txHash,
        messages?.pending || "Transaction pending..."
      );

      // Wait for confirmation
      const receipt = await result.wait();

      // Show success notification
      txNotifications.success(
        toastId,
        txHash,
        messages?.success || "Transaction confirmed!"
      );

      return receipt;
    } else {
      // Unknown format, treat as success
      console.warn("Unknown transaction result format:", result);
      return result as T;
    }
  } catch (error: any) {
    console.error("Transaction error:", error);

    // Parse error message
    let errorMessage = messages?.error || "Transaction failed";

    if (error.code === 4001) {
      errorMessage = "Transaction rejected by user";
    } else if (error.code === -32603) {
      errorMessage = "Internal error - please try again";
    } else if (error.message) {
      // Try to extract revert reason
      const revertMatch = error.message.match(/reason="([^"]*)"/);
      if (revertMatch) {
        errorMessage = `Transaction reverted: ${revertMatch[1]}`;
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction";
      }
    }

    // Show error notification
    if (toastId && txHash) {
      txNotifications.error(toastId, txHash, errorMessage);
    } else {
      txNotifications.errorStandalone(errorMessage);
    }

    return null;
  }
}

/**
 * Address notification helpers
 */
export const addressNotifications = {
  copied: (address: string) => {
    toast.success("Address copied!", {
      description: `${address.slice(0, 6)}...${address.slice(-4)}`,
      duration: 3000,
    });
  },
};

/**
 * Generic notification helpers
 */
export const notifications = {
  success: (message: string, description?: string) => {
    toast.success(message, { description, duration: 4000 });
  },

  error: (message: string, description?: string) => {
    toast.error(message, { description, duration: 6000 });
  },

  info: (message: string, description?: string) => {
    toast.info(message, { description, duration: 4000 });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, { description, duration: 5000 });
  },
};
