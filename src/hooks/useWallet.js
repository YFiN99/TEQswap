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
      setProvider(prov);
      setSigner(await prov.getSigner());
      setWallet(addr);
    } catch (e) { console.error("initWallet error:", e); }
  }, []);

  const connectBrowser = async () => {
    const ethereum = getProvider();
    if (!ethereum) { showToast("Wallet not found!", "err"); return; }
    
    // Deteksi Rabby untuk menyesuaikan format ChainID
    const isRabby = !!ethereum.isRabby;
    const chainIdParam = isRabby ? TEQOIN_CHAIN.chainIdDec : TEQOIN_CHAIN.chainId;

    try {
      const accs = await ethereum.request({ method: "eth_requestAccounts" });
      
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: isRabby ? `0x${TEQOIN_CHAIN.chainIdDec.toString(16)}` : chainIdParam }],
        });
      } catch (sw) {
        if (sw.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: chainIdParam, // Gunakan format yang disukai wallet
              chainName: TEQOIN_CHAIN.chainName,
              rpcUrls: [TEQOIN_CHAIN.rpcUrl],
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: [TEQOIN_CHAIN.blockExplorer],
            }],
          });
          await new Promise(r => setTimeout(r, 1000));
        } else throw sw;
      }
      await initWallet(accs[0]);
      showToast("WALLET CONNECTED");
    } catch (e) { 
      console.error("connect error:", e); 
      showToast("CONNECTION FAILED: " + (e.message || ""), "err"); 
    }
  };

  const connectTelegram = () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const userId = tg.initDataUnsafe?.user?.id;
      tg.openTelegramLink(`https://t.me/TeQoin_Wallet_Bot?start=${userId ? `auth_${userId}` : 'connect_teqswap'}`);
    }
  };

  return { wallet, signer, provider, connectTelegram, connectBrowser, toast, showToast };
}