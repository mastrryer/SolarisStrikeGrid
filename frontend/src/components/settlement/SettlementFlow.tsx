import { useState, useCallback, useEffect } from "react";
import { useContract } from "@/hooks/useContract";
import { publicDecryptHandles } from "@/lib/fhe";
import { SOLARIS_STRIKE_GRID_ADDRESS, SOLARIS_STRIKE_GRID_ABI } from "@/config/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

type SettlementStatus =
  | "idle"           // Initial state
  | "requesting"     // Requesting settlement
  | "waiting"        // Waiting for contract events
  | "decrypting"     // Running decryption
  | "finalizing"     // Finalizing settlement
  | "success"        // Completed successfully
  | "error";         // Error state

interface SettlementFlowProps {
  gridId: string;
  isLocked: boolean;
  isDecryptionRequested?: boolean;
  isSettled?: boolean;
}

export function SettlementFlow({
  gridId,
  isLocked,
  isDecryptionRequested = false,
  isSettled = false
}: SettlementFlowProps) {
  const [status, setStatus] = useState<SettlementStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [handles, setHandles] = useState<string[]>([]);

  const {
    requestSettlement,
    finalizeSettlement,
    isLoading,
    account
  } = useContract();

  // Surface completion state if settlement already finished
  useEffect(() => {
    if (isSettled) {
      setStatus("success");
    } else if (isDecryptionRequested && status === "idle") {
      setStatus("waiting");
    }
  }, [isSettled, isDecryptionRequested, status]);

  // Listen for SettlementRequested events
  useEffect(() => {
    if (!window.ethereum || status !== "waiting") return;

    const setupListener = async () => {
      try {
        const Web3 = (await import("web3")).default;
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(
          SOLARIS_STRIKE_GRID_ABI as any,
          SOLARIS_STRIKE_GRID_ADDRESS
        );

        console.log("[Settlement] Setting up event listener for:", gridId);

        // Subscribe to settlement events
        contract.events.SettlementRequested({
          filter: { gridId }
        })
        .on('data', async (event: any) => {
          console.log("[Settlement] Event received:", event);
          const eventHandles = event.returnValues.ciphertextHandles;

          if (eventHandles && eventHandles.length > 0) {
            setHandles(eventHandles);
            await handleDecryption(eventHandles);
          }
        })
        .on('error', (err: any) => {
          console.error("[Settlement] Event error:", err);
          setError("Failed to listen for events: " + err.message);
          setStatus("error");
        });

      } catch (err: any) {
        console.error("[Settlement] Listener setup error:", err);
        setError("Failed to setup event listener: " + err.message);
        setStatus("error");
      }
    };

    setupListener();
  }, [status, gridId]);

  // Handle ciphertext decryption
  const handleDecryption = async (ciphertextHandles: string[]) => {
    try {
      setStatus("decrypting");
      setError(null);

      console.log("[Settlement] Decrypting handles:", ciphertextHandles);

      // Invoke public decryption
      const result = await publicDecryptHandles(ciphertextHandles as any);

      console.log("[Settlement] Decryption result:", result);

      // Trigger on-chain finalization
      await handleFinalization(result.values, result.proof);

    } catch (err: any) {
      console.error("[Settlement] Decryption error:", err);
      setError("Decryption failed: " + err.message);
      setStatus("error");
    }
  };

  // Handle on-chain finalization
  const handleFinalization = async (decryptedPicks: number[], proof: string) => {
    try {
      setStatus("finalizing");
      setError(null);

      console.log("[Settlement] Finalizing with picks:", decryptedPicks);

      const success = await finalizeSettlement(gridId, decryptedPicks, proof);

      if (success) {
        setStatus("success");
      } else {
        throw new Error("Finalization returned false");
      }

    } catch (err: any) {
      console.error("[Settlement] Finalization error:", err);
      setError("Finalization failed: " + err.message);
      setStatus("error");
    }
  };

  // Start settlement workflow
  const handleStartSettlement = async () => {
    try {
      setStatus("requesting");
      setError(null);

      console.log("[Settlement] Starting settlement for:", gridId);

      const success = await requestSettlement(gridId);

      if (success) {
        setStatus("waiting");
      } else {
        throw new Error("Request settlement returned false");
      }

    } catch (err: any) {
      console.error("[Settlement] Request error:", err);
      setError("Failed to request settlement: " + err.message);
      setStatus("error");
    }
  };

  // Hide component unless the grid is locked
  if (!isLocked) {
    return null;
  }

  // Render success state after settlement
  if (status === "success") {
    return (
      <Card className="border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            Settlement Completed
          </CardTitle>
          <CardDescription>
            Grid has been settled successfully. Winners can now claim their prizes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement Process</CardTitle>
        <CardDescription>
          Two-step settlement with Gateway Oracle decryption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center gap-2 ${
            ["requesting", "waiting", "decrypting", "finalizing", "success"].includes(status)
              ? "text-primary font-medium"
              : "text-muted-foreground"
          }`}>
            {status === "requesting" && <Loader2 className="w-4 h-4 animate-spin" />}
            {["waiting", "decrypting", "finalizing", "success"].includes(status) &&
              <CheckCircle2 className="w-4 h-4" />
            }
            Step 1: Request
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground" />

          <div className={`flex items-center gap-2 ${
            ["decrypting", "finalizing", "success"].includes(status)
              ? "text-primary font-medium"
              : "text-muted-foreground"
          }`}>
            {status === "waiting" && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === "decrypting" && <Loader2 className="w-4 h-4 animate-spin" />}
            {["finalizing", "success"].includes(status) && <CheckCircle2 className="w-4 h-4" />}
            Step 2: Decrypt
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground" />

          <div className={`flex items-center gap-2 ${
            ["finalizing", "success"].includes(status)
              ? "text-primary font-medium"
              : "text-muted-foreground"
          }`}>
            {status === "finalizing" && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === "success" && <CheckCircle2 className="w-4 h-4" />}
            Step 3: Finalize
          </div>
        </div>

        {/* Status messages */}
        <div className="space-y-2">
          {status === "idle" && (
            <Alert>
              <AlertDescription>
                Ready to settle. Click the button below to start the settlement process.
              </AlertDescription>
            </Alert>
          )}

          {status === "requesting" && (
            <Alert>
              <Loader2 className="w-4 h-4 animate-spin" />
              <AlertDescription>
                Requesting settlement on-chain... This will mark all encrypted picks as publicly decryptable.
              </AlertDescription>
            </Alert>
          )}

          {status === "waiting" && (
            <Alert>
              <Loader2 className="w-4 h-4 animate-spin" />
              <AlertDescription>
                Waiting for SettlementRequested event... Once received, decryption will start automatically.
              </AlertDescription>
            </Alert>
          )}

          {status === "decrypting" && (
            <Alert>
              <Loader2 className="w-4 h-4 animate-spin" />
              <AlertDescription>
                Decrypting picks using Gateway Oracle... This may take a moment.
                {handles.length > 0 && ` (${handles.length} handles)`}
              </AlertDescription>
            </Alert>
          )}

          {status === "finalizing" && (
            <Alert>
              <Loader2 className="w-4 h-4 animate-spin" />
              <AlertDescription>
                Finalizing settlement on-chain... Verifying decryption proof and determining winners.
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {status === "idle" && (
            <Button
              onClick={handleStartSettlement}
              disabled={isLoading || !account}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Start Settlement"
              )}
            </Button>
          )}

          {status === "error" && (
            <Button
              onClick={handleStartSettlement}
              variant="destructive"
              className="w-full"
            >
              Retry Settlement
            </Button>
          )}

          {["requesting", "waiting", "decrypting", "finalizing"].includes(status) && (
            <Button disabled className="w-full">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </Button>
          )}
        </div>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground">
          Settlement is a three-step process: (1) Request on-chain to mark picks as decryptable,
          (2) Decrypt off-chain using Gateway Oracle, (3) Finalize on-chain to verify and determine winners.
        </p>
      </CardContent>
    </Card>
  );
}
