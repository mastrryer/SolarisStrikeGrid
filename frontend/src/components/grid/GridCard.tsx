import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users, Clock, Coins, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface GridCardProps {
  gridId: string;
  status: "active" | "locked" | "settled";
  prizePool: number;
  entryFee: number;
  matchCount: number;
  totalPlayers: number;
  timeRemaining?: number;
}

export const GridCard = ({
  gridId,
  status,
  prizePool,
  entryFee,
  matchCount,
  totalPlayers,
  timeRemaining = 0,
}: GridCardProps) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) return `${Math.floor(hours / 24)}d`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-accent/20 text-accent border-accent/30";
      case "locked":
        return "bg-warning/20 text-warning border-warning/30";
      case "settled":
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      viewport={{ once: true }}
      className="h-full"
    >
      <Card className="cyber-card h-full group hover:scale-[1.02] transition-transform relative">
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <Badge className={getStatusColor()}>
              <div className="flex items-center gap-1.5">
                {status === "active" && (
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                )}
                {status === "active" ? "Live" : status === "locked" ? "Locked" : "Settled"}
              </div>
            </Badge>
            <div className="text-right">
              <div className="text-2xl font-bold text-gradient-cyber">
                {prizePool} ETH
              </div>
              <div className="text-xs text-muted-foreground">Prize Pool</div>
            </div>
          </div>

          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {gridId}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{matchCount} Matches</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">{totalPlayers} Players</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">{entryFee} ETH</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-muted-foreground">
                {status === "active" && timeRemaining > 0
                  ? formatTime(timeRemaining)
                  : status === "locked"
                  ? "Locked"
                  : "Ended"}
              </span>
            </div>
          </div>

          {/* Players Progress */}
          {status === "active" && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Player Pool</span>
                <span>{totalPlayers}/100</span>
              </div>
              <Progress value={(totalPlayers / 100) * 100} className="h-1.5" />
            </div>
          )}

          {/* CTA Button */}
          <Link to={`/grid/${encodeURIComponent(gridId)}`}>
            <Button
              variant="ghost"
              className="w-full justify-between group/btn hover:bg-primary/10 hover:text-primary"
            >
              <span>View Details</span>
              <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>

        {/* Animated border glow on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500 -z-10 pointer-events-none" />
      </Card>
    </motion.div>
  );
};
