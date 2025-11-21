import { Link } from "react-router-dom";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Markets", href: "/markets" },
    { name: "Create", href: "/create" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Docs", href: "/docs" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="h-8 w-8 text-primary group-hover:text-secondary transition-colors duration-300" />
              <div className="absolute inset-0 blur-lg bg-primary/30 group-hover:bg-secondary/30 transition-all duration-300" />
            </div>
            <div>
              <span className="text-xl font-bold text-gradient-cyber">
                Solaris Strike
              </span>
              <span className="block text-xs text-muted-foreground">
                Privacy-First Predictions
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Connect Wallet Button */}
          <div className="hidden md:block">
            <ConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-card"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block py-2 text-foreground/80 hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-border">
                <ConnectButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
