import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  ROUTER_ADDRESS, ROUTER_ABI, ERC20_ABI, WTEQ_ADDRESS,
  shortAddr, fmtN, swapDeadline,
} from "../../config/constants";
import TIcon from "../common/TIcon";
import Toast, { useToast } from "../common/Toast";

export default function AddLiqModal({ pair, signer, wallet, provider, onClose }) {
  const [amt0, setAmt0]     = useState("");
  const [amt1, setAmt1]     = useState("");
  const [needApp0,setNeedApp0] = useState(false);
  const [needApp1,setNeedApp1] = useState(false);
  const [approv0, setApprov0] = useState(false);
  const [approv1, setApprov1] = useState(false);
  const [adding,  setAdding]  = useState(false);
  const [progress,setProgress]= useState(0);
  const [errMsg,  setErrMsg]  = useState("");
  const [bals,    setBals]    = useState({});
  const { toast, showToast }  = useToast();

  const tA = pair.a;
  const tB = pair.b;
  const hasETH = tA.address === "native" || tB.address === "native";
  const ethTok = hasETH ? (tA.address === "native" ? tA : tB) : null;
  const erc20Tok = hasETH ? (tA.address === "native" ? tB : tA) : null;

  useEffect(() => { if (wallet && provider) fetchBals(); }, [wallet, provider]);
  useEffect(() => { checkAllowances(); }, [amt0, amt1, wallet, provider]);

  async function fetchBals() {
    const b = {};
    for (const t of [tA, tB]) {
      try {
        if (t.address === "native") {
          b[t.symbol] = ethers.formatEther(await provider.getBalance(wallet));
        } else {
          const c = new ethers.Contract(t.address, ERC20_ABI, provider);
          b[t.symbol] = ethers.formatUnits(await c.balanceOf(wallet), t.decimals);
        }
      } catch { b[t.symbol] = "0"; }
    }
    setBals(b);
  }

  async function checkAllowances() {
    if (!wallet || !provider) return;
    try {
      if (tA.address !== "native" && amt0 && parseFloat(amt0) > 0) {
        const c = new ethers.Contract(tA.address, ERC20_ABI, provider);
        const al = await c.allowance(wallet, ROUTER_ADDRESS);
        setNeedApp0(al < ethers.parseUnits(amt0, tA.decimals));
      } else setNeedApp0(false);

      if (tB.address !== "native" && amt1 && parseFloat(amt1) > 0) {
        const c = new ethers.Contract(tB.address, ERC20_ABI, provider);
        const al = await c.allowance(wallet, ROUTER_ADDRESS);
        setNeedApp1(al < ethers.parseUnits(amt1, tB.decimals));
      } else setNeedApp1(false);
    } catch {}
  }

  async function approve(token, setAppr) {
    setAppr(true); setErrMsg("");
    showToast(`⏳ APPROVING ${token.symbol}...`);
    try {
      const c  = new ethers.Contract(token.address, ERC20_ABI, signer);
      const tx = await c.approve(ROUTER_ADDRESS, ethers.MaxUint256);
      showToast("⏳ WAITING...");
      await tx.wait();
      showToast(`✓ ${token.symbol} APPROVED`);
      await checkAllowances();
    } catch (e) {
      setErrMsg(`✕ Approve ${token.symbol} failed: ` + (e.reason || e.shortMessage || e.message?.slice(0, 80)));
      showToast("✕ APPROVE FAILED", "err");
    }
    setAppr(false);
  }

  async function doAdd() {
    if (!wallet || !signer) return;
    setAdding(true); setProgress(0); setErrMsg("");
    showToast("⏳ ADDING LIQUIDITY...");
    const iv = setInterval(() => setProgress(p => Math.min(p + 8, 90)), 300);

    try {
      const ROUTER_LIQ_ABI = [
        "function addLiquidity(address,address,uint,uint,uint,uint,address,uint) external returns(uint,uint,uint)",
        "function addLiquidityETH(address,uint,uint,uint,address,uint) external payable returns(uint,uint,uint)",
      ];
      const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_LIQ_ABI, signer);
      const dl     = swapDeadline();
      let tx;

      if (hasETH) {
        const ethAmt    = tA.address === "native" ? amt0 : amt1;
        const tokAmt    = tA.address === "native" ? amt1 : amt0;
        const tokAmtWei = ethers.parseUnits(tokAmt, erc20Tok.decimals);
        const ethAmtWei = ethers.parseEther(ethAmt);
        const tokMin    = tokAmtWei * BigInt(995) / BigInt(1000);
        const ethMin    = ethAmtWei * BigInt(995) / BigInt(1000);
        tx = await router.addLiquidityETH(
          erc20Tok.address, tokAmtWei, tokMin, ethMin, wallet, dl, { value: ethAmtWei }
        );
      } else {
        const a0Wei = ethers.parseUnits(amt0, tA.decimals);
        const a1Wei = ethers.parseUnits(amt1, tB.decimals);
        const a0Min = a0Wei * BigInt(995) / BigInt(1000);
        const a1Min = a1Wei * BigInt(995) / BigInt(1000);
        tx = await router.addLiquidity(
          tA.address, tB.address, a0Wei, a1Wei, a0Min, a1Min, wallet, dl
        );
      }

      showToast("⏳ TX SENT — WAITING...");
      await tx.wait();
      clearInterval(iv); setProgress(100);
      setTimeout(() => {
        setAdding(false); setProgress(0);
        showToast(`✓ LIQUIDITY ADDED: ${amt0} ${tA.symbol} + ${amt1} ${tB.symbol}`);
        setAmt0(""); setAmt1("");
        fetchBals();
      }, 400);
    } catch (e) {
      clearInterval(iv); setAdding(false); setProgress(0);
      const msg = e.reason || e.shortMessage || e.message?.slice(0, 100) || "Unknown";
      setErrMsg("✕ FAILED: " + msg);
      showToast("✕ TX FAILED", "err");
    }
  }

  // button logic
  const busy = adding || approv0 || approv1;
  const noAmt = !amt0 || !amt1 || parseFloat(amt0) <= 0 || parseFloat(amt1) <= 0;
  let btnCls = "disabled", btnText = "[ ENTER AMOUNTS ]", btnAction = () => {};
  if (!wallet || !signer)  { btnCls = "approve"; btnText = "[ CONNECT WALLET ]"; }
  else if (approv0 || approv1) { btnCls = "executing"; btnText = "APPROVING..."; }
  else if (adding)         { btnCls = "executing"; btnText = "ADDING LIQUIDITY..."; }
  else if (noAmt)          { btnCls = "disabled";  btnText = "[ ENTER AMOUNTS ]"; }
  else if (needApp0)       { btnCls = "approve";   btnText = `[ APPROVE ${tA.symbol} ]`; btnAction = () => approve(tA, setApprov0); }
  else if (needApp1)       { btnCls = "approve";   btnText = `[ APPROVE ${tB.symbol} ]`; btnAction = () => approve(tB, setApprov1); }
  else                     { btnCls = "ready";     btnText = "[ ADD LIQUIDITY ]"; btnAction = doAdd; }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <Toast toast={toast} />

        <div className="modal-hd">
          <div>
            <div className="card-title">ADD_LIQUIDITY</div>
            <div className="card-sub">{tA.symbol}/{tB.symbol} // UniswapV2 // 0.3% FEE</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Token A */}
        <div className="token-box" style={{ marginBottom: 4 }}>
          <span className="token-box-tag">{tA.symbol} AMOUNT</span>
          <div className="token-row">
            <TIcon t={tA} size={26} />
            <span className="t-sym" style={{ marginRight: "auto", fontSize: 13 }}>{tA.symbol}</span>
            <input
              className="amt-input"
              type="number"
              placeholder="0.0000"
              value={amt0}
              onChange={e => setAmt0(e.target.value)}
            />
          </div>
          <div className="token-meta">
            <span className="usd-val">BAL: {fmtN(bals[tA.symbol] || "0", 4)}</span>
            <button className="max-btn" onClick={() => setAmt0(parseFloat(bals[tA.symbol] || "0").toFixed(6))}>MAX</button>
          </div>
        </div>

        <div className="liq-plus">+</div>

        {/* Token B */}
        <div className="token-box">
          <span className="token-box-tag">{tB.symbol} AMOUNT</span>
          <div className="token-row">
            <TIcon t={tB} size={26} />
            <span className="t-sym" style={{ marginRight: "auto", fontSize: 13 }}>{tB.symbol}</span>
            <input
              className="amt-input"
              type="number"
              placeholder="0.0000"
              value={amt1}
              onChange={e => setAmt1(e.target.value)}
            />
          </div>
          <div className="token-meta">
            <span className="usd-val">BAL: {fmtN(bals[tB.symbol] || "0", 4)}</span>
            <button className="max-btn" onClick={() => setAmt1(parseFloat(bals[tB.symbol] || "0").toFixed(6))}>MAX</button>
          </div>
        </div>

        {/* info */}
        {amt0 && amt1 && parseFloat(amt0) > 0 && parseFloat(amt1) > 0 && (
          <div className="info-box" style={{ marginTop: 10 }}>
            <div className="info-row"><span className="ik">PAIR</span><span className="iv">{tA.symbol}/{tB.symbol}</span></div>
            <div className="info-row"><span className="ik">RATIO</span><span className="iv">{fmtN(parseFloat(amt0) / parseFloat(amt1), 6)} {tA.symbol}/{tB.symbol}</span></div>
            <div className="info-row"><span className="ik">SLIPPAGE</span><span className="iv good">0.5%</span></div>
            <div className="info-row"><span className="ik">ROUTER</span><span className="iv" style={{ fontSize: 10 }}>{shortAddr(ROUTER_ADDRESS)}</span></div>
          </div>
        )}

        {errMsg && <div className="err-box" style={{ marginTop: 10 }}>{errMsg}</div>}

        {busy && (
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        <button
          className={`cyber-btn ${btnCls}`}
          style={{ marginTop: 14 }}
          onClick={btnAction}
          disabled={btnCls === "disabled" || btnCls === "executing"}
        >
          {btnText}
        </button>
      </div>
    </div>
  );
}