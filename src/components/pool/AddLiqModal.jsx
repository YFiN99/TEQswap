import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount, useWriteContract, useReadContract, useBalance } from "wagmi";
import { ROUTER_ADDRESS, ROUTER_ABI, ERC20_ABI, shortAddr, fmtN, swapDeadline } from "../../config/constants";
import TIcon from "../common/TIcon";
import Toast, { useToast } from "../common/Toast";

export default function AddLiqModal({ pair, onClose }) {
  const { address: wallet } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { toast, showToast } = useToast();

  const [amt0, setAmt0] = useState("");
  const [amt1, setAmt1] = useState("");
  const [adding, setAdding] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const tA = pair.a;
  const tB = pair.b;
  const hasETH = tA.address === "native" || tB.address === "native";
  const erc20Tok = hasETH ? (tA.address === "native" ? tB : tA) : null;

  // Mengambil saldo via Wagmi
  const { data: balA } = useBalance({ address: wallet, token: tA.address === "native" ? undefined : tA.address });
  const { data: balB } = useBalance({ address: wallet, token: tB.address === "native" ? undefined : tB.address });

  async function doAdd() {
    setAdding(true); setErrMsg("");
    showToast("⏳ ADDING LIQUIDITY...");
    
    try {
      const dl = swapDeadline();
      const a0Wei = ethers.parseUnits(amt0, tA.decimals || 18);
      const a1Wei = ethers.parseUnits(amt1, tB.decimals || 18);
      const minA = (a0Wei * 995n) / 1000n;
      const minB = (a1Wei * 995n) / 1000n;

      if (hasETH) {
        const ethVal = tA.address === "native" ? a0Wei : a1Wei;
        await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: 'addLiquidityETH',
          args: [erc20Tok.address, tA.address === "native" ? a1Wei : a0Wei, minB, minA, wallet, dl],
          value: ethVal
        });
      } else {
        await writeContractAsync({
          address: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: 'addLiquidity',
          args: [tA.address, tB.address, a0Wei, a1Wei, minA, minB, wallet, dl]
        });
      }
      
      showToast(`✓ LIQUIDITY ADDED`);
      onClose();
    } catch (e) {
      setErrMsg("✕ FAILED: " + (e.shortMessage || e.message?.slice(0, 50)));
      showToast("✕ TX FAILED", "err");
    }
    setAdding(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <Toast toast={toast} />
        <div className="modal-hd">
          <div className="card-title">ADD_LIQUIDITY</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Input Token A */}
        <div className="token-box">
          <TIcon t={tA} size={26} />
          <input type="number" value={amt0} onChange={e => setAmt0(e.target.value)} placeholder="0.00" />
          <span>BAL: {balA ? fmtN(balA.formatted, 4) : "0"}</span>
        </div>

        {/* Input Token B */}
        <div className="token-box">
          <TIcon t={tB} size={26} />
          <input type="number" value={amt1} onChange={e => setAmt1(e.target.value)} placeholder="0.00" />
          <span>BAL: {balB ? fmtN(balB.formatted, 4) : "0"}</span>
        </div>

        <button className="cyber-btn" onClick={doAdd} disabled={adding}>
          {adding ? "ADDING..." : "ADD LIQUIDITY"}
        </button>
      </div>
    </div>
  );
}