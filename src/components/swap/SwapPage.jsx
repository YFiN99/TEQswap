import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { TOKENS, ROUTER_ADDRESS, ROUTER_ABI, ERC20_ABI, buildPath, swapDeadline, fmtN } from "../../config/constants";
import TIcon from "../common/TIcon";
import TokenModal from "./TokenModal";
import { useToast } from "../common/Toast";

export default function SwapPage() {
  const { address: wallet } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { showToast } = useToast();

  const [tIn, setTIn] = useState(TOKENS[0]);
  const [tOut, setTOut] = useState(TOKENS[1]);
  const [amtIn, setAmtIn] = useState("");
  const [amtOut, setAmtOut] = useState("");
  const [swapping, setSwapping] = useState(false);
  const [modal, setModal] = useState(null);

  // Quote logic
  useEffect(() => {
    async function getQuote() {
      if (!amtIn || parseFloat(amtIn) <= 0) return setAmtOut("");
      try {
        const provider = new ethers.JsonRpcProvider("https://rpc.teqoin.io"); // Gunakan Provider statis untuk baca
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
        const inWei = ethers.parseUnits(amtIn, tIn.decimals || 18);
        const path = buildPath(tIn, tOut);
        const amounts = await router.getAmountsOut(inWei, path);
        setAmtOut(ethers.formatUnits(amounts[amounts.length - 1], tOut.decimals || 18));
      } catch { setAmtOut("0"); }
    }
    const timer = setTimeout(getQuote, 500);
    return () => clearTimeout(timer);
  }, [amtIn, tIn, tOut]);

  async function doSwap() {
    setSwapping(true);
    try {
      const path = buildPath(tIn, tOut);
      const dl = swapDeadline();
      const inWei = ethers.parseUnits(amtIn, tIn.decimals || 18);
      const outMin = ethers.parseUnits((parseFloat(amtOut) * 0.995).toFixed(tOut.decimals || 18), tOut.decimals || 18);

      if (tIn.address === "native") {
        await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: 'swapExactETHForTokens',
          args: [outMin, path, wallet, dl],
          value: inWei
        });
      } else {
        await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [inWei, outMin, path, dl], // Sesuaikan urutan argumen ABI Anda
          account: wallet
        });
      }
      showToast("✓ SWAP SUCCESS");
    } catch (e) {
      console.error(e);
      showToast("✕ SWAP FAILED", "err");
    }
    setSwapping(false);
  }

  return (
    <div className="swap-container">
      {/* Pastikan struktur return Anda seperti ini */}
      <div className="swap-box">
        <input value={amtIn} onChange={(e) => setAmtIn(e.target.value)} placeholder="0.00" />
        <button onClick={() => setModal("in")}>{tIn.symbol}</button>
      </div>

      <button className="swap-btn" onClick={doSwap} disabled={swapping}>
        {swapping ? "SWAPPING..." : "SWAP"}
      </button>

      {modal && (
        <TokenModal 
          onSelect={(t) => { modal === "in" ? setTIn(t) : setTOut(t); setModal(null); }} 
          onClose={() => setModal(null)} 
        />
      )}
    </div>
  );
}