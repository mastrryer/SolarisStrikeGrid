import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[128px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-[128px] animate-float" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Powered by FHE Encryption</span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-gradient-cyber">Predict.</span>{" "}
              <span className="text-gradient-blue-purple">Encrypt.</span>{" "}
              <span className="text-accent">Win.</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Privacy-first multi-match prediction markets. Your picks stay encrypted with FHE until settlement.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all text-lg px-8 group"
            >
              <Link to="/markets">
                Explore Markets
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary/50 hover:bg-primary/10 text-lg px-8"
            >
              <Link to="/create">
                Create Grid
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-16"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient-cyber">256</div>
              <div className="text-sm text-muted-foreground">Active Grids</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient-blue-purple">1,847</div>
              <div className="text-sm text-muted-foreground">Total Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">42.5 ETH</div>
              <div className="text-sm text-muted-foreground">Prize Pool</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
