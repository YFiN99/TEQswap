import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { TEQOIN_CHAIN } from "../config/constants";

export default function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectBrowser = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    if (!window.ethereum) {
      alert("MetaMask atau Rabby tidak terdeteksi!");
      setIsConnecting(false);
      return;
    }

    try {
      // 1. Minta akses akun terlebih dahulu
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      
      // 2. Coba pindah/tambah jaringan dengan penanganan error yang lebih luas
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: TEQOIN_CHAIN.chainId }],
        });
      } catch (switchError) {
        // Kode 4902 (Chain belum ada) OR -32603 (Sering terjadi saat RPC tidak sinkron)
        if (switchError.code === 4902 || switchError.code === -32603) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: TEQOIN_CHAIN.chainId,
                chainName: TEQOIN_CHAIN.chainName,
                rpcUrls: [TEQOIN_CHAIN.rpcUrl],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: [TEQOIN_CHAIN.blockExplorer],
              }],
            });
          } catch (addError) {
            console.error("Gagal menambah jaringan:", addError);
            throw addError; // Berhenti jika gagal menambah jaringan
          }
        } else {
          throw switchError;
        }
      }

      // 3. Inisialisasi Ethers v6 setelah dipastikan jaringan benar
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const userSigner = await browserProvider.getSigner();
      
      setWallet(accounts[0]);
      setSigner(userSigner);
      setProvider(browserProvider);
      
    } catch (err) {
      console.error("Proses koneksi gagal:", err);
      alert("Koneksi gagal: " + (err.message || "Pastikan jaringan TeQoin aktif di dompet Anda"));
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  return { wallet, signer, provider, connectBrowser };
}