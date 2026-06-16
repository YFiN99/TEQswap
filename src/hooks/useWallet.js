import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { TEQOIN_CHAIN } from "../config/constants";

const getProvider = () => {
  if (typeof window === "undefined" || !window.ethereum) return null;
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
      
      // Cek ChainID (Pastikan TEQOIN_CHAIN.chainIdDec adalah angka desimal)
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

  const connectTelegram = () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const userId = tg.initDataUnsafe?.user?.id;
      tg.openTelegramLink(`https://t.me/TeQoin_Wallet_Bot?start=${userId ? `auth_${userId}` : 'connect_teqswap'}`);
    }
  };

  const connectBrowser = async () => {
    const ethereum = getProvider();
    if (!ethereum) {
      showToast("MetaMask/Wallet not found!", "err");
      return;
    }
    
    try {
      const accs = await ethereum.request({ method: "eth_requestAccounts" });
      
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: TEQOIN_CHAIN.chainId }], // Pastikan format hex benar (misal: "0x66b69")
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
        } else {
          throw sw;
        }
      }
      
      await initWallet(accs[0]);
      showToast("WALLET CONNECTED");
    } catch (e) {
      console.error("connect error:", e);
      showToast("CONNECTION FAILED", "err");
    }
  };

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const savedWallet = localStorage.getItem("teqoin_wallet");
      if (savedWallet) setWallet(savedWallet);
    } else {
      const ethereum = getProvider();
      if (ethereum) {
        const handleAccountsChanged = (accs) => accs.length > 0 ? initWallet(accs[0]) : (setWallet(null), setSigner(null), setProvider(null));
        ethereum.on("accountsChanged", handleAccountsChanged);
        ethereum.on("chainChanged", () => window.location.reload());
        ethereum.request({ method: "eth_accounts" }).then(accs => accs.length > 0 && initWallet(accs[0])).catch(console.error);
        return () => {
          ethereum.removeListener("accountsChanged", handleAccountsChanged);
        };
      }
    }
  }, [initWallet]);

  return { wallet, signer, provider, wrongChain, connectTelegram, connectBrowser, toast, showToast };
}