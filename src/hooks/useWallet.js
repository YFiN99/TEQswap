import { useState, useCallback, useRef } from "react";
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

    try {
      // 1. Minta akses akun
      const accs = await ethereum.request({ method: "eth_requestAccounts" });
      
      // 2. Coba switch ke jaringan TeQoin
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: TEQOIN_CHAIN.chainId }], // Pastikan ini "0x66b69"
        });
      } catch (sw) {
        // Jika error 4902 (Chain belum ada), tambahkan jaringan
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
          // Tunggu sedikit agar dompet selesai memproses penambahan
          await new Promise(r => setTimeout(r, 1000));
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

  const connectTelegram = () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const userId = tg.initDataUnsafe?.user?.id;
      tg.openTelegramLink(`https://t.me/TeQoin_Wallet_Bot?start=${userId ? `auth_${userId}` : 'connect_teqswap'}`);
    }
  };

  return { wallet, signer, provider, connectTelegram, connectBrowser, toast, showToast };
}