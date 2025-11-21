import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { GridCard } from "@/components/grid/GridCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const featuredGrids = [
  {
    gridId: "EPL-Week-15",
    status: "active" as const,
    prizePool: 12.5,
    entryFee: 0.05,
    matchCount: 10,
    totalPlayers: 67,
    timeRemaining: 86400,
  },
  {
    gridId: "NBA-Nov-Playoffs",
    status: "active" as const,
    prizePool: 8.3,
    entryFee: 0.02,
    matchCount: 8,
    totalPlayers: 124,
    timeRemaining: 172800,
  },
  {
    gridId: "UFC-296-Predictions",
    status: "locked" as const,
    prizePool: 15.7,
    entryFee: 0.1,
    matchCount: 12,
    totalPlayers: 89,
  },
];

const Home = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />

      {/* Live Grids Section */}
      <section className="py-24 bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-gradient-blue-purple">Featured Grids</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Jump into the action with our most popular prediction markets
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {featuredGrids.map((grid) => (
              <GridCard key={grid.gridId} {...grid} />
            ))}
          </div>

          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 group"
            >
              <Link to="/markets">
                View All Markets
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-gradient-cyber">How It Works</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start winning
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Choose a Grid",
                description: "Browse active prediction markets and select the one that interests you.",
              },
              {
                step: "02",
                title: "Make Predictions",
                description: "Submit your encrypted picks for each match. Your predictions stay private with FHE.",
              },
              {
                step: "03",
                title: "Claim Rewards",
                description: "When the grid settles, winners automatically share the prize pool based on accuracy.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center space-y-4"
              >
                <div className="text-6xl font-bold text-gradient-cyber opacity-20">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
