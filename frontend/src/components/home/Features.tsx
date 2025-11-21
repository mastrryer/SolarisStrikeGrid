import { Shield, Dice5, Calendar, Lock } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Shield,
    title: "FHE Encryption",
    description: "Your predictions are encrypted with Zama's fhEVM technology, ensuring complete privacy until settlement.",
    gradient: "from-cyber-blue to-cyan-400",
  },
  {
    icon: Dice5,
    title: "Provable Randomness",
    description: "Fair settlement using blockchain randomness. No manipulation, complete transparency.",
    gradient: "from-secondary to-pink-500",
  },
  {
    icon: Calendar,
    title: "Long-Term Markets",
    description: "Prediction grids run up to 90 days, perfect for seasonal sports and long-term forecasting.",
    gradient: "from-accent to-emerald-400",
  },
];

export const Features = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-gradient-cyber">Why Solaris Strike?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The most advanced privacy-preserving prediction market platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="cyber-card h-full p-8 space-y-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover glow effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${feature.gradient} transition-opacity duration-300 rounded-xl`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
