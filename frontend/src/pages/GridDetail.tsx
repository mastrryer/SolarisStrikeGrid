import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  Clock,
  Coins,
  Lock,
  Shield,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useContract } from "@/hooks/useContract";
import { SettlementFlow } from "@/components/settlement/SettlementFlow";
import { notifications } from "@/lib/notifications";

const formatTimeRemaining = (seconds: number) => {
  if (seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours >= 24) {
    return `${Math.floor(hours / 24)}d`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const GridDetail = () => {
  const params = useParams();
  const gridId = params.gridId ? decodeURIComponent(params.gridId) : null;
  const [picks, setPicks] = useState<Record<number, string>>({});

  const {
    account,
    connectWallet,
    enterGrid,
    isLoading: contractLoading,
    getGrid,
    getMatches,
    getGridStats,
  } = useContract();

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["grid-detail", gridId],
    enabled: Boolean(gridId),
    refetchInterval: 30000,
    queryFn: async () => {
      if (!gridId) return null;
      const [grid, stats, matches] = await Promise.all([
        getGrid(gridId),
        getGridStats(gridId),
        getMatches(gridId),
      ]);

      if (!grid || !stats) {
        return null;
      }

      return { grid, stats, matches };
    },
  });

  useEffect(() => {
    setPicks({});
  }, [gridId]);

  const grid = data?.grid;
  const stats = data?.stats;
  const matches = data?.matches ?? [];

  const entryFeeEth = grid ? formatEther(grid.entryFee) : "0";
  const prizePoolEth = grid ? Number(formatEther(grid.prizePool)) : 0;
  const entryFeeDisplay = grid ? Number(entryFeeEth) : 0;
  const totalPlayers = grid ? Number(grid.totalPlayers) : 0;
  const matchCount = stats ? Number(stats.matchCount) : matches.length;
  const isLocked = grid ? Date.now() / 1000 >= Number(grid.lockTime) : false;
  const isSettled = grid?.settled ?? false;
  const isDecryptionRequested =
    Boolean(!stats?.isActive && !isSettled && Number(stats?.timeUntilLock ?? 0n) === 0) &&
    isLocked;
  const timeUntilLock = stats ? Number(stats.timeUntilLock) : 0;
  const statusLabel = isSettled ? "Settled" : isLocked ? "Locked" : "Live";

  const formattedTime = isLocked
    ? "Locked"
    : stats
    ? formatTimeRemaining(timeUntilLock)
    : "--";

  const handlePickChange = (index: number, value: string) => {
    setPicks((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmitEntry = async () => {
    if (!account) {
      await connectWallet();
      return;
    }

    if (!gridId || !grid || matches.length === 0) {
      notifications.error("Missing grid data", "Unable to submit your picks right now.");
      return;
    }

    const picksArray = matches.map((_, index) =>
      parseInt(picks[index] ?? "0", 10)
    );

    try {
      const success = await enterGrid(gridId, picksArray, entryFeeEth);
      if (success) {
        notifications.success("Entry submitted!", "Your encrypted picks are on-chain.");
        setPicks({});
      }
    } catch (err: any) {
      console.error("Failed to submit entry:", err);
      notifications.error("Failed to submit entry", err.message);
    }
  };

  const isFormValid = useMemo(() => {
    if (!matches.length) return false;
    return matches.every((_, index) => picks[index] !== undefined);
  }, [matches, picks]);

  if (!gridId) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-muted-foreground">Grid not found.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !grid || !stats) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold">Unable to load grid.</p>
          <p className="text-muted-foreground">
            Make sure the grid exists on Sepolia and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cyber-card p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
          <div>
              <Badge
                className={`mb-3 ${
                  statusLabel === "Live"
                    ? "bg-accent/20 text-accent border-accent/30"
                    : statusLabel === "Locked"
                    ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                    : "bg-muted/20 text-muted-foreground border-muted/30"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full mr-2 ${
                    statusLabel === "Live"
                      ? "bg-accent animate-pulse"
                      : statusLabel === "Locked"
                      ? "bg-yellow-500"
                      : "bg-muted-foreground"
                  }`}
                />
                {statusLabel}
              </Badge>
              <h1 className="text-4xl font-bold text-gradient-cyber mb-2">
                {gridId}
              </h1>
              <p className="text-muted-foreground">
                Created by {grid.creator.slice(0, 6)}...{grid.creator.slice(-4)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">Prize Pool</p>
              <p className="text-4xl font-bold text-gradient-blue-purple">
                {prizePoolEth.toFixed(4)} ETH
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Players", value: totalPlayers },
              { icon: Trophy, label: "Matches", value: matchCount },
              { icon: Coins, label: "Entry Fee", value: `${entryFeeDisplay.toFixed(4)} ETH` },
              { icon: Clock, label: "Time Left", value: formattedTime },
            ].map((stat, index) => (
              <div key={index} className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <stat.icon className="h-4 w-4" />
                  <span className="text-xs">{stat.label}</span>
                </div>
                <div className="text-xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Settlement Flow - Show when grid is locked */}
        {(isLocked || isSettled) && gridId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <SettlementFlow
              gridId={gridId}
              isLocked={isLocked}
              isDecryptionRequested={isDecryptionRequested}
              isSettled={isSettled}
            />
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Matches List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Matches ({matchCount})
                </CardTitle>
                <CardDescription>Current prediction distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {matches.length === 0 ? (
                      <p className="text-muted-foreground">No matches found for this grid.</p>
                    ) : (
                      matches.map((match, index) => {
                        const picksLeft = Number(match.picksLeft);
                        const picksRight = Number(match.picksRight);
                        const total = picksLeft + picksRight;
                        const leftPercentage = total === 0 ? 50 : (picksLeft / total) * 100;

                        return (
                          <div key={index} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">
                                Match {index + 1}
                              </span>
                            </div>

                            <h4 className="font-semibold">{match.label}</h4>

                            {/* Voting Distribution */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <ArrowLeft className="h-3 w-3 text-primary" />
                                  </div>
                                  <span>Left</span>
                                </div>
                                <span className="font-mono text-primary">
                                  {picksLeft}
                                </span>
                              </div>

                              <Progress value={leftPercentage} className="h-2" />

                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-secondary/20 flex items-center justify-center">
                                    <ArrowRight className="h-3 w-3 text-secondary" />
                                  </div>
                                  <span>Right</span>
                                </div>
                                <span className="font-mono text-secondary">
                                  {picksRight}
                                </span>
                              </div>
                            </div>

                            {index < matches.length - 1 && (
                              <Separator className="mt-6" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Prediction Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Your Encrypted Picks
                </CardTitle>
                <CardDescription>
                  Picks are encrypted locally before submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {matches.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No matches configured for this grid.
                      </p>
                    ) : (
                      matches.map((_, index) => (
                        <div key={index} className="space-y-2">
                          <Label className="text-sm font-medium">
                            Match {index + 1}
                          </Label>
                          <RadioGroup
                            value={picks[index]}
                            onValueChange={(value) => handlePickChange(index, value)}
                            disabled={isLocked || isSettled}
                          >
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <RadioGroupItem
                                  value="0"
                                  id={`${index}-left`}
                                  className="peer sr-only"
                                />
                                <Label
                                  htmlFor={`${index}-left`}
                                  className="flex items-center justify-center gap-2 rounded-lg border-2 border-border bg-card p-3 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                                >
                                  <ArrowLeft className="h-4 w-4" />
                                  Left
                                </Label>
                              </div>
                              <div className="flex-1">
                                <RadioGroupItem
                                  value="1"
                                  id={`${index}-right`}
                                  className="peer sr-only"
                                />
                                <Label
                                  htmlFor={`${index}-right`}
                                  className="flex items-center justify-center gap-2 rounded-lg border-2 border-border bg-card p-3 hover:bg-muted peer-data-[state=checked]:border-secondary peer-data-[state=checked]:bg-secondary/10 cursor-pointer transition-all"
                                >
                                  Right
                                  <ArrowRight className="h-4 w-4" />
                                </Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Encryption Status */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <Shield className="h-5 w-5 text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-accent">
                      Encryption Ready
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Picks encrypted before leaving your browser
                    </p>
                  </div>
                </div>

                {/* Entry Fee */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <span className="text-sm text-muted-foreground">Entry Fee</span>
                  <span className="text-lg font-bold">{entryFeeDisplay.toFixed(4)} ETH</span>
                </div>

                {/* Submit Button */}
                {!account ? (
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={connectWallet}
                    size="lg"
                  >
                    Connect Wallet
                  </Button>
                ) : isLocked ? (
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      Grid is locked. No new entries allowed.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    disabled={!isFormValid || contractLoading || matches.length === 0}
                    onClick={handleSubmitEntry}
                    size="lg"
                  >
                    {contractLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Encrypting & Submitting...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Submit Encrypted Entry
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GridDetail;
