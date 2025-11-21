import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultWallets,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

const appName = "Solaris Strike Grid";
const walletConnectProjectId = "a01e2fcf54da4837a5a35f8ff498a2af";

const { connectors } = getDefaultWallets({
  appName,
  projectId: walletConnectProjectId,
});

const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors,
  transports: {
    [sepolia.id]: http(),
  },
  ssr: false,
});

const queryClient = new QueryClient();

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
