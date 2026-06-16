import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { TEQOIN_CHAIN } from "../config/constants";

const getProvider = () => {
  if (typeof window === "undefined" || !window.ethereum) return null;
  // Menangani konflik multi-wallet (MetaMask + OKX/Rabby)
  return window.ethereum.providers ? window.ethereum.providers[0] : window.ethereum;
};

export default function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [wrongChain, setWrongChain] = useState(false);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((msg, type = "ok") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const initWallet = useCallback(async (addr) => {
    const ethereum = getProvider();
    if (!ethereum) return;
    try {
      const prov = new ethers.BrowserProvider(ethereum);
      const network = await prov.getNetwork();
      
      // Membandingkan Chain ID dengan aman
      if (Number(network.chainId) !== TEQOIN_CHAIN.chainIdDec) {
        setWrongChain(true);
        setProvider(prov);
        return;
      }
      
      setWrongChain(false);
      const sign = await prov.getSigner();
      setProvider(prov);
      setSigner(sign);
      setWallet(addr);
    } catch (e) {
      console.error("initWallet error:", e);
    }
  }, []);

  async function connect() {
    // 1. Logika Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const userId = tg.initDataUnsafe?.user?.id;
      const startParam = userId ? `auth_${userId}` : 'connect_teqswap';
      tg.openTelegramLink(`https://t.me/TeQoin_Wallet_Bot?start=${startParam}`);
      return;
    }

    // 2. Logika Browser Wallet (Injected)
    const ethereum = getProvider();
    if (!ethereum) {
      showToast("MetaMask/Wallet not found!", "err");
      return;
    }
    
    try {
      // Minta akses akun
      const accs = await ethereum.request({ method: "eth_requestAccounts" });
      
      // Coba pindah jaringan
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: TEQOIN_CHAIN.chainId }],
        });
      } catch (sw) {
        if (sw.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: TEQOIN_CHAIN.chainId,
              chainName: TEQOIN_CHAIN.chainName,
              rpcUrls: [TEQOIN_CHAIN.rpcUrl],
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: [TEQOIN_CHAIN.blockExplorer],
            }],
          });
        } else throw sw;
      }
      
      await initWallet(accs[0]);
      showToast("WALLET CONNECTED");
    } catch (e) {
      console.error("connect error:", e);
      showToast("CONNECTION FAILED", "err");
    }
  }

  useEffect(() => {
    // A. Logika Telegram
    if (window.Telegram?.WebApp) {
      const savedWallet = localStorage.getItem("teqoin_wallet");
      if (savedWallet) setWallet(savedWallet);
      return;
    }

    // B. Logika Browser Wallet Event Listeners
    const ethereum = getProvider();
    if (!ethereum) return;

    const handleAccountsChanged = (accs) => {
      if (accs.length > 0) initWallet(accs[0]);
      else { 
        setWallet(null); 
        setSigner(null); 
        setProvider(null); 
      }
    };

    // Reload halaman saat user pindah jaringan di wallet
    const handleChainChanged = () => window.location.reload();

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    // Initial check untuk status akun saat load halaman
    ethereum.request({ method: "eth_accounts" })
      .then(accs => { if (accs.length > 0) initWallet(accs[0]); })
      .catch(console.error);

    // Cleanup: Sangat penting untuk mencegah memory leaks
    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [initWallet]);

  return { wallet, signer, provider, wrongChain, connect, toast, showToast };
}