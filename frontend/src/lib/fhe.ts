import { SOLARIS_STRIKE_GRID_ADDRESS } from "@/config/contracts";
import { bytesToHex, getAddress } from "viem";
import type { Address } from "viem";

declare global {
  interface Window {
    RelayerSDK?: any;
    relayerSDK?: any;
    ethereum?: any;
    okxwallet?: any;
  }
}

let fhevmInstance: any = null;

/**
 * Get SDK from window (loaded via static script tag in HTML)
 * SDK 0.3.0-5 is loaded via static script tag in index.html
 */
const getSDK = (): any => {
  if (typeof window === "undefined") {
    throw new Error("FHE SDK requires browser environment");
  }

  const sdk = window.RelayerSDK || window.relayerSDK;

  if (!sdk) {
    throw new Error(
      "RelayerSDK not loaded. Please ensure the script tag is in your HTML."
    );
  }

  return sdk;
};

/**
 * Initialize FHE instance (singleton pattern)
 */
export const initializeFHE = async (provider?: any): Promise<any> => {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  if (typeof window === "undefined") {
    throw new Error("FHE SDK requires browser environment");
  }

  const ethereumProvider =
    provider ||
    window.ethereum ||
    window.okxwallet?.provider ||
    window.okxwallet;

  if (!ethereumProvider) {
    throw new Error(
      "No Ethereum provider found. Please connect your wallet first."
    );
  }

  try {
    const sdk = getSDK();
    const { initSDK, createInstance, SepoliaConfig } = sdk;

    console.log("[FHE] Initializing SDK...");
    await initSDK();

    const config = { ...SepoliaConfig, network: ethereumProvider };
    fhevmInstance = await createInstance(config);

    console.log("[FHE] SDK initialized successfully");
    return fhevmInstance;
  } catch (error) {
    console.error("[FHE] Initialization failed:", error);
    throw error;
  }
};

/**
 * Get FHE instance if it exists
 */
export const getFHEInstance = (): any => {
  return fhevmInstance;
};

/**
 * Check if FHE is ready
 */
export const isFheReady = (): boolean => {
  return fhevmInstance !== null;
};

/**
 * Encrypt picks array for grid prediction
 * @param picks Array of picks (0=Left, 1=Right)
 * @param userAddress User's wallet address
 * @returns Encrypted picks handles and proof
 */
export async function encryptPicks(
  picks: number[],
  userAddress: Address
): Promise<{
  handles: `0x${string}`[];
  proof: `0x${string}`;
}> {
  if (!isFheReady()) {
    await initializeFHE();
  }

  const instance = getFHEInstance();
  if (!instance) {
    throw new Error("FHE SDK not initialized");
  }

  // Validate picks
  if (!picks.every((pick) => pick === 0 || pick === 1)) {
    throw new Error("All picks must be 0 (Left) or 1 (Right)");
  }

  const contractAddr = getAddress(SOLARIS_STRIKE_GRID_ADDRESS);
  const userAddr = getAddress(userAddress);

  console.log("[FHE] Encrypting picks:", picks);

  // Create encrypted input
  const input = instance.createEncryptedInput(contractAddr, userAddr);

  // Add each pick as euint8
  picks.forEach((pick) => {
    input.add8(pick);
  });

  // Encrypt
  const { handles, inputProof } = await input.encrypt();

  console.log("[FHE] Encryption complete");

  return {
    handles: handles.map((h: Uint8Array) => bytesToHex(h) as `0x${string}`),
    proof: bytesToHex(inputProof) as `0x${string}`,
  };
}

/**
 * Decrypt publicly available handles using the relayer SDK
 */
export async function publicDecryptHandles(handles: `0x${string}`[]) {
  if (handles.length === 0) {
    throw new Error("No handles provided for public decryption");
  }

  if (!isFheReady()) {
    await initializeFHE();
  }

  const instance = getFHEInstance();
  if (!instance) {
    throw new Error("FHE SDK not initialized");
  }

  console.log("[FHE] Decrypting handles...");

  const result = await instance.publicDecrypt(handles);

  // Normalize result
  const normalized: Record<string, number | boolean> = {};
  Object.entries(result.clearValues || {}).forEach(([handle, value]) => {
    const key = handle.toLowerCase();
    normalized[key] = typeof value === "bigint" ? Number(value) : value;
  });

  const values = handles.map(
    (handle) => normalized[handle.toLowerCase()] ?? 0
  );

  console.log("[FHE] Decryption complete:", values);

  return {
    values,
    abiEncoded: result.abiEncodedClearValues as `0x${string}`,
    proof: result.decryptionProof as `0x${string}`,
  };
}
