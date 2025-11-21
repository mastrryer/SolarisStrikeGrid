import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { GridCard } from "@/components/grid/GridCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContract } from "@/hooks/useContract";

type MarketGrid = {
  gridId: string;
  status: "active" | "locked" | "settled";
  prizePool: number;
  entryFee: number;
  matchCount: number;
  totalPlayers: number;
  timeRemaining?: number;
};

const Markets = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { listGrids, getGrid, getGridStats } = useContract();

  const { data: markets = [], isLoading } = useQuery({
    queryKey: ["markets"],
    queryFn: async (): Promise<MarketGrid[]> => {
      const ids = await listGrids();
      if (!ids.length) return [];

      const results = await Promise.all(
        ids.map(async (gridId) => {
          const [grid, stats] = await Promise.all([
            getGrid(gridId),
            getGridStats(gridId),
          ]);

          if (!grid || !stats) return null;

          const prizePool = Number(formatEther(grid.prizePool));
          const entryFee = Number(formatEther(grid.entryFee));
          const status = grid.settled
            ? "settled"
            : stats.isActive
            ? "active"
            : "locked";

          return {
            gridId,
            status,
            prizePool,
            entryFee,
            matchCount: Number(stats.matchCount),
            totalPlayers: Number(grid.totalPlayers),
            timeRemaining: Number(stats.timeUntilLock),
          };
        })
      );

      return results.filter((grid): grid is MarketGrid => Boolean(grid));
    },
    refetchInterval: 30000,
  });

  const filteredGrids = useMemo(() => {
    return markets.filter((grid) => {
      const matchesStatus = statusFilter === "all" || grid.status === statusFilter;
      const matchesSearch = grid.gridId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [markets, statusFilter, searchQuery]);

  const sortedGrids = useMemo(() => {
    return [...filteredGrids].sort((a, b) => b.prizePool - a.prizePool);
  }, [filteredGrids]);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-gradient-cyber">Prediction Markets</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Explore active grids and start making encrypted predictions
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="locked">Locked</TabsTrigger>
                <TabsTrigger value="settled">Settled</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Sort */}
            <Select defaultValue="prize-high">
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prize-high">Prize: High to Low</SelectItem>
                <SelectItem value="prize-low">Prize: Low to High</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="most-players">Most Players</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search grids..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 text-sm text-muted-foreground"
        >
          {isLoading
            ? "Loading on-chain grids..."
            : `Showing ${sortedGrids.length} ${sortedGrids.length === 1 ? "grid" : "grids"}`}
        </motion.div>

        {/* Grid Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Fetching markets from Sepolia...</span>
          </div>
        ) : sortedGrids.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sortedGrids.map((grid, index) => (
              <motion.div
                key={grid.gridId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <GridCard {...grid} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-xl text-muted-foreground">
              No grids found matching your filters
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Markets;
