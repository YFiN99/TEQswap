import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { TEQOIN_CHAIN } from "../config/constants";

export default function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectBrowser = useCallback(async () => {
    if (isConnecting) return; // Mencegah klik ganda/loop
    setIsConnecting(true);

    if (typeof window.ethereum === 'undefined') {
      alert("MetaMask atau Rabby tidak terdeteksi di browser Anda!");
      setIsConnecting(false);
      return;
    }

    try {
      const eth = window.ethereum;
      
      // 1. Minta akses akun
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      
      // 2. Coba pindah ke jaringan TeQoin L2
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: TEQOIN_CHAIN.chainId }],
        });
      } catch (switchError) {
        // Jika jaringan belum ada (4902), tambahkan secara otomatis
        if (switchError.code === 4902) {
          await eth.request({
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
          console.error("Gagal berpindah jaringan:", switchError);
        }
      }

      // 3. Inisialisasi Ethers v6
      const browserProvider = new ethers.BrowserProvider(eth);
      const userSigner = await browserProvider.getSigner();
      
      setWallet(accounts[0]);
      setSigner(userSigner);
      setProvider(browserProvider);
      
    } catch (err) {
      console.error("Koneksi dibatalkan atau gagal:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const connectTelegram = useCallback(async () => {
    // Logika khusus Telegram Mini App
    alert("Koneksi Telegram sedang disinkronkan...");
  }, []);

  return { wallet, signer, provider, connectBrowser, connectTelegram };
}