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

  async function initWallet(addr) {
    const ethereum = getProvider();
    if (!ethereum) return;
    try {
      const prov = new ethers.BrowserProvider(ethereum);
      const net = await prov.getNetwork();
      if (Number(net.chainId) !== TEQOIN_CHAIN.chainIdDec) {
        setWrongChain(true);
        return;
      }
      setWrongChain(false);
      const sign = await prov.getSigner();
      setProvider(prov);
      setSigner(sign);
      setWallet(addr);
    } catch (e) {
      console.error("initWallet:", e);
    }
  }

  async function connect() {
    // 1. Logika Khusus Telegram
    if (window.Telegram?.WebApp) {
      // Arahkan ke bot untuk proses koneksi
      window.Telegram.WebApp.openTelegramLink("https://t.me/TeQoin_Wallet_Bot?start=connect_teqswap");
      return;
    }

    // 2. Logika Browser (Metamask/Injected)
    const ethereum = getProvider();
    if (!ethereum) {
      showToast("Wallet not found!", "err");
      return;
    }
    try {
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
      const accs = await ethereum.request({ method: "eth_requestAccounts" });
      await initWallet(accs[0]);
      showToast("WALLET CONNECTED");
    } catch (e) {
      console.error("connect:", e);
      showToast("CONNECT FAILED", "err");
    }
  }

  useEffect(() => {
    // Cek jika di Telegram, coba ambil data dari initData (jika sudah tersimpan)
    if (window.Telegram?.WebApp) {
      // Di sini Anda bisa menambahkan logika untuk mengecek LocalStorage 
      // jika bot sudah menyimpan wallet user setelah redirect
      const savedWallet = localStorage.getItem("teqoin_wallet");
      if (savedWallet) setWallet(savedWallet);
      return;
    }

    // Logika standard untuk Browser
    const ethereum = getProvider();
    if (!ethereum) return;

    const handleAccountsChanged = (accs) => {
      if (accs.length) initWallet(accs[0]);
      else { setWallet(null); setSigner(null); }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", () => window.location.reload());

    ethereum.request({ method: "eth_accounts" })
      .then(accs => { if (accs.length) initWallet(accs[0]); })
      .catch(() => {});

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", () => window.location.reload());
      }
    };
  }, []);

  return { wallet, signer, provider, wrongChain, connect, toast, showToast };
}