import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  Trophy,
  TrendingUp,
  Coins,
  Award,
  LogIn,
  Edit,
  Undo,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useContract } from "@/hooks/useContract";

const txTypeMeta: Record<
  number,
  {
    label: string;
    icon: typeof LogIn;
    bg: string;
    color: string;
    positive?: boolean;
  }
> = {
  0: { label: "ENTER", icon: LogIn, bg: "bg-primary/20", color: "text-primary" },
  1: { label: "ADJUST", icon: Edit, bg: "bg-secondary/20", color: "text-secondary" },
  2: { label: "CLAIM_PRIZE", icon: Trophy, bg: "bg-accent/20", color: "text-accent", positive: true },
  3: { label: "CLAIM_REFUND", icon: Undo, bg: "bg-warning/20", color: "text-warning", positive: true },
};

const Dashboard = () => {
  const { account, connectWallet, getUserTransactions, getGridsByPlayer } = useContract();

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
  } = useQuery({
    queryKey: ["user-transactions", account],
    enabled: Boolean(account),
    queryFn: () => getUserTransactions(account ?? undefined),
    refetchInterval: 30000,
  });

  const {
    data: playerGrids = [],
    isLoading: gridsLoading,
  } = useQuery({
    queryKey: ["player-grids", account],
    enabled: Boolean(account),
    queryFn: () => getGridsByPlayer(account ?? undefined),
    refetchInterval: 60000,
  });

  const stats = useMemo(() => {
    const base = {
      totalGrids: account ? playerGrids.length : 0,
      wins: 0,
      totalWagered: 0,
      totalWon: 0,
    };

    transactions.forEach((tx) => {
      const ethValue = Number(formatEther(tx.entryFee));
      if (tx.txType === 0) {
        base.totalWagered += ethValue;
      }
      if (tx.txType === 2) {
        base.wins += 1;
        base.totalWon += ethValue;
      }
    });

    return base;
  }, [transactions, playerGrids, account]);

  const isFetchingData = (transactionsLoading || gridsLoading) && Boolean(account);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-gradient-cyber">Dashboard</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Track your prediction history and winnings straight from the contract
          </p>
        </motion.div>

        {!account && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">Connect your wallet</p>
                  <p className="text-muted-foreground">
                    Sign in with MetaMask to fetch your encrypted prediction history.
                  </p>
                </div>
                <Button onClick={connectWallet} size="lg">
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Grids</p>
                  <p className="text-3xl font-bold">{stats.totalGrids}</p>
                </div>
                <Trophy className="h-10 w-10 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Wins</p>
                  <p className="text-3xl font-bold text-accent">{stats.wins}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Wagered</p>
                  <p className="text-3xl font-bold">{stats.totalWagered.toFixed(4)} ETH</p>
                </div>
                <Coins className="h-10 w-10 text-secondary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Won</p>
                  <p className="text-3xl font-bold text-warning">{stats.totalWon.toFixed(4)} ETH</p>
                </div>
                <Award className="h-10 w-10 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="cyber-card">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Full log pulled directly from SolarisStrikeGrid smart contract
                </p>
              </div>
              {account && (
                <p className="text-xs text-muted-foreground font-mono">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {!account ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Connect your wallet to load on-chain activity.
                </div>
              ) : isFetchingData ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Syncing with Sepolia...
                </div>
              ) : transactions.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No transactions found yet.
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {transactions.map((tx, index) => {
                      const meta = txTypeMeta[tx.txType] ?? txTypeMeta[0];
                      const Icon = meta.icon;
                      const timestampMs = Number(tx.timestamp) * 1000;
                      const ethValue = Number(formatEther(tx.entryFee));
                      const amount = `${meta.positive ? "+" : "-"}${ethValue.toFixed(4)} ETH`;

                      return (
                        <motion.div
                          key={`${tx.gridId}-${tx.timestamp}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${meta.bg}`}>
                              <Icon className={`h-5 w-5 ${meta.color}`} />
                            </div>

                            <div>
                              <p className="font-medium">{meta.label.replace("_", " ")}</p>
                              <p className="text-sm text-muted-foreground break-all">
                                {tx.gridId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(timestampMs, { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p
                              className={`font-mono font-medium ${
                                meta.positive ? "text-accent" : "text-muted-foreground"
                              }`}
                            >
                              {amount}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
