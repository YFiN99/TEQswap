import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { TEQOIN_CHAIN } from "../config/constants";

export default function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fungsi deteksi provider yang lebih cerdas (Anti-Conflict)
  const getProvider = () => {
    // Prioritaskan Rabby jika tersedia, lalu cek ethereum (MetaMask/OKX)
    return window.rabby || window.ethereum;
  };

  const connectBrowser = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    const providerInstance = getProvider();

    if (!providerInstance) {
      alert("Dompet (MetaMask/Rabby/OKX) tidak terdeteksi!");
      setIsConnecting(false);
      return;
    }

    try {
      // 1. Minta akses akun
      const accounts = await providerInstance.request({ method: "eth_requestAccounts" });
      
      // 2. Switch/Add Jaringan dengan penanganan error yang benar
      try {
        await providerInstance.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: TEQOIN_CHAIN.chainId }],
        });
      } catch (switchError) {
        // Kode 4902: Chain belum ada di dompet
        if (switchError.code === 4902 || switchError.code === -32603) {
          await providerInstance.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: TEQOIN_CHAIN.chainId,
              chainName: TEQOIN_CHAIN.chainName,
              rpcUrls: [TEQOIN_CHAIN.rpcUrl],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: [TEQOIN_CHAIN.blockExplorer],
            }],
          });
        } else {
          throw switchError;
        }
      }

      // 3. Inisialisasi Ethers v6 dengan provider yang benar
      const browserProvider = new ethers.BrowserProvider(providerInstance);
      const userSigner = await browserProvider.getSigner();
      
      setWallet(accounts[0]);
      setSigner(userSigner);
      setProvider(browserProvider);
      
    } catch (err) {
      console.error("Proses koneksi gagal:", err);
      alert("Koneksi gagal: " + (err.message || "Pastikan jaringan TeQoin aktif"));
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  return { wallet, signer, provider, connectBrowser };
}