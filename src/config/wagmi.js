import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { WC_PROJECT_ID, TEQOIN_CHAIN } from './constants';

export const config = createConfig({
  chains: [
    {
      id: TEQOIN_CHAIN.chainIdDec,
      name: TEQOIN_CHAIN.chainName,
      nativeCurrency: { name: 'Ether', symbol: TEQOIN_CHAIN.symbol, decimals: 18 },
      rpcUrls: { default: { http: [TEQOIN_CHAIN.rpcUrl] } },
      blockExplorers: { default: { name: 'Explorer', url: TEQOIN_CHAIN.blockExplorer } },
    }
  ],
  connectors: [
    injected(),
    walletConnect({ projectId: WC_PROJECT_ID }),
  ],
  transports: {
    [TEQOIN_CHAIN.chainIdDec]: http(TEQOIN_CHAIN.rpcUrl),
  },
});