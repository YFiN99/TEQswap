import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { TEQOIN_CHAIN } from "../config/constants";

export default function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [wrongChain, setWrongChain] = useState(false);

  // State untuk Toast
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((msg, type = "ok") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  async function initWallet(addr) {
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
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
    if (!window.ethereum) {
      showToast("Install MetaMask!", "err");
      return;
    }
    try {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: TEQOIN_CHAIN.chainId }],
        });
      } catch (sw) {
        if (sw.code === 4902) {
          await window.ethereum.request({
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
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      await initWallet(accs[0]);
      showToast("WALLET CONNECTED");
    } catch (e) {
      console.error("connect:", e);
      showToast("CONNECT FAILED", "err");
    }
  }

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.on("accountsChanged", (accs) => {
      if (accs.length) initWallet(accs[0]);
      else { setWallet(null); setSigner(null); }
    });
    window.ethereum.on("chainChanged", () => window.location.reload());

    window.ethereum.request({ method: "eth_accounts" })
      .then(accs => { if (accs.length) initWallet(accs[0]); })
      .catch(() => {});

    return () => {
      window.ethereum?.removeAllListeners?.("accountsChanged");
      window.ethereum?.removeAllListeners?.("chainChanged");
    };
  }, []);

  return { wallet, signer, provider, wrongChain, connect, toast, showToast };
}