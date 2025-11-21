import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Trophy,
  Coins,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Play,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const Docs = () => {
  const sections = [
    {
      id: "overview",
      title: "Platform Overview",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Solaris Strike Grid is a privacy-first prediction market platform built on Zama's fhEVM (Fully Homomorphic Encryption for Ethereum Virtual Machine).
            Make encrypted predictions on sports matches, eSports tournaments, and other events without revealing your choices until the results are finalized.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <Lock className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-semibold mb-1">Private Predictions</h4>
              <p className="text-sm text-muted-foreground">
                Your picks are encrypted on-chain using FHE
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <Shield className="h-8 w-8 text-secondary mb-2" />
              <h4 className="font-semibold mb-1">Secure & Fair</h4>
              <p className="text-sm text-muted-foreground">
                No one can see your predictions until settlement
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <Trophy className="h-8 w-8 text-accent mb-2" />
              <h4 className="font-semibold mb-1">Win Prizes</h4>
              <p className="text-sm text-muted-foreground">
                Correct predictions share the prize pool
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "how-to-play",
      title: "How to Play",
      icon: Users,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Connect Your Wallet</h4>
                <p className="text-muted-foreground text-sm">
                  Connect your MetaMask or other Web3 wallet to the Sepolia testnet. Make sure you have some test ETH for entry fees.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Browse Active Grids</h4>
                <p className="text-muted-foreground text-sm">
                  Visit the Markets page to see all available prediction grids. Each grid contains multiple matches you'll predict on.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Make Your Predictions</h4>
                <p className="text-muted-foreground text-sm">
                  For each match in the grid, choose either "Left" or "Right". Your picks are encrypted locally in your browser before being submitted to the blockchain.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  4
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Pay Entry Fee & Submit</h4>
                <p className="text-muted-foreground text-sm">
                  Pay the entry fee (varies by grid) and submit your encrypted predictions. Your entry is now locked on-chain.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  5
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Wait for Settlement</h4>
                <p className="text-muted-foreground text-sm">
                  After the grid locks, the creator will trigger settlement. The Gateway Oracle decrypts all predictions and calculates winners.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  6
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Claim Your Prize</h4>
                <p className="text-muted-foreground text-sm">
                  If you win, claim your share of the prize pool from the Dashboard page. Prizes are distributed proportionally among all winners.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "prediction-mechanism",
      title: "Prediction Mechanism",
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Solaris Strike Grid uses Fully Homomorphic Encryption (FHE) to keep your predictions private until results are finalized.
          </p>

          <div className="space-y-3 mt-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Local Encryption:</span>
                <span className="text-muted-foreground ml-2">
                  Your picks are encrypted in your browser using the fhEVM SDK before being sent to the blockchain.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">On-Chain Storage:</span>
                <span className="text-muted-foreground ml-2">
                  Encrypted predictions are stored in the smart contract. No one can see the actual values.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Grid Lock:</span>
                <span className="text-muted-foreground ml-2">
                  After the lock time, no more entries are accepted. The grid is ready for settlement.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Gateway Decryption:</span>
                <span className="text-muted-foreground ml-2">
                  The fhEVM Gateway Oracle decrypts all predictions asynchronously and returns the plaintext results.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Winner Calculation:</span>
                <span className="text-muted-foreground ml-2">
                  The contract compares decrypted predictions with actual results and identifies winners.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium text-accent">Privacy Guarantee:</span>
                <span className="text-muted-foreground ml-2">
                  Thanks to FHE, your predictions remain encrypted throughout the entire process.
                  Even the contract owner and other players cannot see your choices until settlement is finalized.
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "rewards",
      title: "Reward Calculation",
      icon: Trophy,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Prize distribution is fair and transparent. All entry fees contribute to the prize pool,
            which is then shared among winners.
          </p>

          <div className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Prize Pool Formation
              </h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span>Total Entry Fees:</span>
                  <span className="font-mono">Player Count × Entry Fee</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Prize Pool:</span>
                  <span className="font-mono text-accent">100% to Winners</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Winner Calculation
              </h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>A winner is a player who correctly predicts ALL matches in the grid:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Match 1: ✓ Correct</li>
                  <li>Match 2: ✓ Correct</li>
                  <li>Match 3: ✓ Correct</li>
                  <li>... and so on for all matches</li>
                </ul>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Distribution Formula
              </h4>
              <div className="text-sm text-muted-foreground space-y-3">
                <div className="bg-card p-3 rounded border">
                  <div className="font-mono text-xs mb-1">Individual Prize = Prize Pool ÷ Winner Count</div>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Examples:</p>
                  <div className="pl-4 space-y-1">
                    <div>• 10 players, 0.05 ETH entry → 0.5 ETH pool</div>
                    <div>• 2 winners → Each gets 0.25 ETH</div>
                    <div>• 1 winner → Gets full 0.5 ETH</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-warning">No Winners Scenario:</span>
                  <span className="text-muted-foreground ml-2">
                    If no player correctly predicts all matches, each participant can claim a refund of their entry fee.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "claiming",
      title: "Claiming Rewards",
      icon: Coins,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            After settlement is complete, winners can claim their prizes. The process is simple and secure.
          </p>

          <div className="space-y-4 mt-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Check Your Status</h4>
                <p className="text-muted-foreground text-sm">
                  Visit the Dashboard page to see all your entries. Settled grids will show whether you won or can claim a refund.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-accent" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Claim Your Prize</h4>
                <p className="text-muted-foreground text-sm">
                  If you won, click the "Claim Prize" button. The contract will transfer your share of the prize pool to your wallet.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Claim Window</h4>
                <p className="text-muted-foreground text-sm">
                  Prizes can be claimed at any time after settlement. There is no deadline, but it's best to claim soon after winning.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg mt-6">
            <h4 className="font-semibold mb-3">Claiming Process:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Connect your wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Navigate to Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Find your winning entry</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Click "Claim Prize"</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Confirm transaction in wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-accent" />
                <span className="text-accent font-medium">Receive ETH in your wallet</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "faq",
      title: "Frequently Asked Questions",
      icon: AlertCircle,
      content: (
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-semibold mb-1">What is FHE and why does it matter?</h4>
              <p className="text-muted-foreground text-sm">
                Fully Homomorphic Encryption (FHE) allows computations on encrypted data without decrypting it.
                This means your predictions stay private on-chain until the moment of settlement, preventing manipulation and front-running.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-semibold mb-1">Can I change my predictions after submitting?</h4>
              <p className="text-muted-foreground text-sm">
                Yes! Before the grid locks, you can adjust your entry. The contract only stores the latest encrypted prediction.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-semibold mb-1">What happens if no one wins?</h4>
              <p className="text-muted-foreground text-sm">
                If no player correctly predicts all matches, everyone can claim a full refund of their entry fee. No one loses money.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-semibold mb-1">How long does settlement take?</h4>
              <p className="text-muted-foreground text-sm">
                Settlement is a two-step process. First, decryption is requested from the Gateway Oracle (async, may take a few minutes).
                Then, after receiving decrypted data, the grid creator finalizes settlement to calculate winners.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-semibold mb-1">Are there any fees besides the entry fee?</h4>
              <p className="text-muted-foreground text-sm">
                You'll only pay standard Ethereum gas fees for transactions. There are no platform fees - 100% of entry fees go into the prize pool.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-semibold mb-1">Which network is this deployed on?</h4>
              <p className="text-muted-foreground text-sm">
                Currently deployed on Sepolia testnet. Make sure your wallet is connected to Sepolia and you have test ETH.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-gradient-cyber">Documentation</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Learn how to use Solaris Strike Grid and maximize your winning potential
          </p>
        </motion.div>

        {/* Demo Video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card className="cyber-card overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                Platform Demo
              </CardTitle>
              <CardDescription>
                Watch how to create predictions, submit entries, and claim rewards on Solaris Strike Grid
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-lg overflow-hidden bg-black/50 aspect-video">
                <video
                  controls
                  className="w-full h-full"
                  poster="/bets.mp4"
                >
                  <source src="/bets.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
            >
              <section.icon className="h-4 w-4" />
              {section.title}
            </a>
          ))}
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <section.icon className="h-6 w-6 text-primary" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>{section.content}</CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-12 text-center"
        >
          <Card className="cyber-card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold mb-2">Ready to Start?</h3>
              <p className="text-muted-foreground mb-6">
                Connect your wallet and make your first encrypted prediction
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="/markets"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Browse Markets
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium"
                >
                  Create Grid
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Docs;
