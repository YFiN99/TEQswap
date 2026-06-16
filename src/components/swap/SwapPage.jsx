import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { useAccount, useWriteContract, useReadContract, useBalance } from "wagmi";
import {
  TOKENS, ROUTER_ADDRESS, ROUTER_ABI, ERC20_ABI,
  buildPath, swapDeadline, shortAddr, fmtN,
} from "../../config/constants";
import TIcon from "../common/TIcon";
import TokenModal from "./TokenModal";
import { useToast } from "../common/Toast";

export default function SwapPage() {
  const { address: wallet, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  const [tIn,  setTIn]  = useState(TOKENS[0]);
  const [tOut, setTOut] = useState(TOKENS[1]);
  const [amtIn,  setAmtIn]  = useState("");
  const [amtOut, setAmtOut] = useState("");
  const [slip,   setSlip]   = useState("0.5");
  const [settings, setSettings] = useState(false);
  const [modal,    setModal]    = useState(null);
  const [swapping,   setSwapping]   = useState(false);
  const [approving,  setApproving]  = useState(false);
  const { toast, showToast } = useToast();

  // 1. Menggunakan Hook wagmi untuk cek allowance
  // Kita pakai readContract (opsional, bisa tetap pakai ethers untuk read-only)
  const [needApprove, setNeedApprove] = useState(false);

  // 2. Fetch Quote & Allowance
  useEffect(() => {
    async function getQuote() {
      if (!amtIn || parseFloat(amtIn) <= 0) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
        const path = buildPath(tIn, tOut);
        const inWei = ethers.parseUnits(amtIn, tIn.decimals || 18);
        const amounts = await router.getAmountsOut(inWei, path);
        setAmtOut(ethers.formatUnits(amounts[amounts.length - 1], tOut.decimals || 18));

        if (wallet && tIn.address !== "native") {
          const tok = new ethers.Contract(tIn.address, ERC20_ABI, provider);
          const al = await tok.allowance(wallet, ROUTER_ADDRESS);
          setNeedApprove(al < inWei);
        }
      } catch (e) {
        setAmtOut("");
      }
    }
    const timer = setTimeout(getQuote, 500);
    return () => clearTimeout(timer);
  }, [amtIn, tIn, tOut, wallet]);

  // 3. Fungsi Swap Baru dengan wagmi
  async function doSwap() {
    setSwapping(true);
    try {
      const path = buildPath(tIn, tOut);
      const dl = swapDeadline();
      const inWei = ethers.parseUnits(amtIn, tIn.decimals || 18);
      const outMin = ethers.parseUnits((parseFloat(amtOut) * (1 - slip / 100)).toFixed(tOut.decimals || 18), tOut.decimals || 18);

      let tx;
      if (tIn.address === "native") {
        tx = await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: 'swapExactETHForTokens',
          args: [outMin, path, wallet, dl],
          value: inWei
        });
      } else {
        tx = await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [inWei, outMin, path, wallet, dl]
        });
      }
      showToast("✓ SWAP BERHASIL");
    } catch (e) {
      showToast("✕ SWAP GAGAL", "err");
    }
    setSwapping(false);
  }

  // ... (Sisa fungsi UI seperti doApprove, flip, setMax tetap sama)
  // Pastikan Anda menggunakan `writeContractAsync` di dalam doApprove juga.

  return (
    // ... (Template JSX Anda tetap bisa dipakai)
  );
}