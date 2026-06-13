import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import {
  TOKENS, ROUTER_ADDRESS, ROUTER_ABI, ERC20_ABI,
  buildPath, swapDeadline, shortAddr, fmtN,
} from "../../config/constants";
import TIcon from "../common/TIcon";
import TokenModal from "./TokenModal";
import Toast, { useToast } from "../common/Toast";

export default function SwapPage({ wallet, signer, provider, onConnect }) {
  const [tIn,  setTIn]  = useState(TOKENS[0]); // ETH
  const [tOut, setTOut] = useState(TOKENS[1]); // TEQ
  const [amtIn,  setAmtIn]  = useState("");
  const [amtOut, setAmtOut] = useState("");
  const [slip,   setSlip]   = useState("0.5");
  const [settings,   setSettings]   = useState(false);
  const [modal,      setModal]      = useState(null); // "in"|"out"
  const [swapping,   setSwapping]   = useState(false);
  const [approving,  setApproving]  = useState(false);
  const [needApprove,setNeedApprove]= useState(false);
  const [progress,   setProgress]   = useState(0);
  const [spinning,   setSpinning]   = useState(false);
  const [errMsg,     setErrMsg]     = useState("");
  const [balances,   setBalances]   = useState({});
  const { toast, showToast } = useToast();
  const quoteTimer = useRef(null);

  // ── fetch balances ──
  useEffect(() => {
    if (wallet && provider) fetchBalances();
  }, [wallet, provider, tIn, tOut]);

  async function fetchBalances() {
    if (!provider || !wallet) return;
    const bals = {};
    for (const t of TOKENS) {
      try {
        if (t.address === "native") {
          const b = await provider.getBalance(wallet);
          bals[t.symbol] = ethers.formatEther(b);
        } else {
          const c = new ethers.Contract(t.address, ERC20_ABI, provider);
          const b = await c.balanceOf(wallet);
          bals[t.symbol] = ethers.formatUnits(b, t.decimals);
        }
      } catch { bals[t.symbol] = "0"; }
    }
    setBalances(bals);
  }

  // ── quote ──
  useEffect(() => {
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    if (!amtIn || parseFloat(amtIn) <= 0 || !provider) {
      setAmtOut(""); setNeedApprove(false); return;
    }
    quoteTimer.current = setTimeout(getQuote, 500);
    return () => clearTimeout(quoteTimer.current);
  }, [amtIn, tIn, tOut, provider]);

  async function getQuote() {
    setErrMsg("");
    try {
      const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
      const path   = buildPath(tIn, tOut);
      const inDec  = tIn.address  === "native" ? 18 : tIn.decimals;
      const outDec = tOut.address === "native" ? 18 : tOut.decimals;
      const inWei  = ethers.parseUnits(amtIn, inDec);
      const amounts = await router.getAmountsOut(inWei, path);
      setAmtOut(ethers.formatUnits(amounts[amounts.length - 1], outDec));

      // check allowance
      if (wallet && tIn.address !== "native") {
        const tok = new ethers.Contract(tIn.address, ERC20_ABI, provider);
        const al  = await tok.allowance(wallet, ROUTER_ADDRESS);
        setNeedApprove(al < inWei);
      } else {
        setNeedApprove(false);
      }
    } catch (e) {
      setAmtOut("");
      const msg = e.reason || e.shortMessage || e.message || "";
      if (msg.includes("INSUFFICIENT_LIQUIDITY") || msg.includes("execution reverted"))
        setErrMsg("⚠ NO LIQUIDITY for this pair — add liquidity first");
      else if (msg.includes("INVALID_PATH"))
        setErrMsg("⚠ INVALID PATH — pair tidak tersedia");
      else
        setErrMsg("⚠ Quote failed: " + msg.slice(0, 80));
    }
  }

  // ── approve ──
  async function doApprove() {
    setApproving(true); setErrMsg("");
    showToast(`⏳ APPROVING ${tIn.symbol}...`);
    try {
      const tok = new ethers.Contract(tIn.address, ERC20_ABI, signer);
      const tx  = await tok.approve(ROUTER_ADDRESS, ethers.MaxUint256);
      showToast("⏳ WAITING CONFIRMATION...");
      await tx.wait();
      showToast(`✓ ${tIn.symbol} APPROVED`);
      setNeedApprove(false);
    } catch (e) {
      setErrMsg("✕ Approve failed: " + (e.reason || e.shortMessage || e.message?.slice(0, 80)));
      showToast("✕ APPROVE FAILED", "err");
    }
    setApproving(false);
  }

  // ── swap ──
  async function doSwap() {
    if (!wallet) { onConnect(); return; }
    if (!amtIn || parseFloat(amtIn) <= 0 || !amtOut) return;
    setSwapping(true); setProgress(0); setErrMsg("");
    showToast("⏳ BROADCASTING TX...");

    const iv = setInterval(() => setProgress(p => Math.min(p + 8, 90)), 300);
    try {
      const router  = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
      const path    = buildPath(tIn, tOut);
      const dl      = swapDeadline();
      const slipPct = parseFloat(slip) / 100;
      const inDec   = tIn.address  === "native" ? 18 : tIn.decimals;
      const outDec  = tOut.address === "native" ? 18 : tOut.decimals;
      const inWei   = ethers.parseUnits(amtIn, inDec);
      const outMin  = ethers.parseUnits(
        (parseFloat(amtOut) * (1 - slipPct)).toFixed(outDec), outDec
      );

      let tx;
      if      (tIn.address  === "native") tx = await router.swapExactETHForTokens(outMin, path, wallet, dl, { value: inWei });
      else if (tOut.address === "native") tx = await router.swapExactTokensForETH(inWei, outMin, path, wallet, dl);
      else                                tx = await router.swapExactTokensForTokens(inWei, outMin, path, wallet, dl);

      showToast("⏳ TX SENT — WAITING...");
      await tx.wait();
      clearInterval(iv); setProgress(100);

      setTimeout(() => {
        setSwapping(false); setProgress(0);
        showToast(`✓ SWAP DONE: ${amtIn} ${tIn.symbol} → ${parseFloat(amtOut).toFixed(4)} ${tOut.symbol}`);
        setAmtIn(""); setAmtOut("");
        fetchBalances();
      }, 400);
    } catch (e) {
      clearInterval(iv); setSwapping(false); setProgress(0);
      const msg = e.reason || e.shortMessage || e.message?.slice(0, 100) || "Unknown";
      setErrMsg("✕ SWAP FAILED: " + msg);
      showToast("✕ SWAP FAILED", "err");
    }
  }

  function flip() {
    setSpinning(true); setTimeout(() => setSpinning(false), 600);
    setTIn(tOut); setTOut(tIn);
    setAmtIn(amtOut || ""); setAmtOut("");
  }

  function setMax() {
    const b = balances[tIn.symbol];
    if (b) setAmtIn(parseFloat(b).toFixed(6));
  }

  const minOut  = amtOut ? (parseFloat(amtOut) * (1 - parseFloat(slip) / 100)).toFixed(6) : "0";
  const rate    = amtIn && amtOut ? fmtN(parseFloat(amtOut) / parseFloat(amtIn), 6) : "—";
  const impact  = amtIn ? Math.min(parseFloat(amtIn) * 0.015, 3).toFixed(2) : "0.00";

  // button state
  let btnCls = "disabled", btnText = "[ ENTER AMOUNT ]", btnAction = () => {};
  if (!wallet)      { btnCls = "conn";      btnText = "[ CONNECT WALLET ]"; btnAction = onConnect; }
  else if (approving)  { btnCls = "executing"; btnText = "APPROVING..."; }
  else if (swapping)   { btnCls = "executing"; btnText = "EXECUTING..."; }
  else if (!amtIn || parseFloat(amtIn) <= 0) { btnCls = "disabled"; btnText = "[ ENTER AMOUNT ]"; }
  else if (needApprove){ btnCls = "approve";   btnText = `[ APPROVE ${tIn.symbol} ]`; btnAction = doApprove; }
  else if (amtOut)     { btnCls = "ready";     btnText = "[ EXECUTE SWAP ]"; btnAction = doSwap; }

  return (
    <>
      <Toast toast={toast} />
      {modal && (
        <TokenModal
          exclude={modal === "in" ? tOut.symbol : tIn.symbol}
          onSelect={t => modal === "in" ? setTIn(t) : setTOut(t)}
          onClose={() => setModal(null)}
          balances={balances}
        />
      )}

      <div className="cyber-card" style={{ marginBottom: 0 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 0" }}>
          <div>
            <div className="card-title">SWAP_MODULE</div>
            <div className="card-sub">ROUTER:{shortAddr(ROUTER_ADDRESS)} // LIVE</div>
          </div>
          <button className="settings-btn" onClick={() => setSettings(s => !s)}>⚙</button>
        </div>

        {/* slippage */}
        {settings && (
          <div style={{ margin: "12px 14px 0" }}>
            <div className="slip-panel">
              <div className="slip-title">SLIPPAGE_TOLERANCE</div>
              <div className="slip-opts">
                {["0.1", "0.5", "1.0"].map(v => (
                  <button key={v} className={`slip-opt${slip === v ? " on" : ""}`} onClick={() => setSlip(v)}>{v}%</button>
                ))}
                <input
                  className="slip-custom"
                  placeholder="CUSTOM%"
                  value={!["0.1", "0.5", "1.0"].includes(slip) ? slip : ""}
                  onChange={e => setSlip(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* FROM */}
        <div style={{ margin: "12px 14px 0" }}>
          <div className="token-box">
            <span className="token-box-tag">INPUT</span>
            <div className="token-row">
              <div className="token-sel" onClick={() => setModal("in")}>
                <TIcon t={tIn} />
                <span className="t-sym">{tIn.symbol}</span>
                <span className="t-chev">▼</span>
              </div>
              <input
                className="amt-input"
                type="number"
                placeholder="0.0000"
                value={amtIn}
                onChange={e => setAmtIn(e.target.value)}
              />
            </div>
            <div className="token-meta">
              <span className="usd-val">on-chain quote</span>
              <div className="bal-row">
                BAL: {fmtN(balances[tIn.symbol] || "0", 4)}
                <button className="max-btn" onClick={setMax}>MAX</button>
              </div>
            </div>
          </div>
        </div>

        {/* GEAR */}
        <div className="gear-wrap">
          <div className="gear-track" />
          <div className={`gear-ring${swapping || approving ? " spinning" : spinning ? " spin" : ""}`} />
          <button className="gear-btn" onClick={flip}>⇅</button>
        </div>

        {/* TO */}
        <div style={{ margin: "0 14px 0" }}>
          <div className="token-box">
            <span className="token-box-tag">OUTPUT (estimated)</span>
            <div className="token-row">
              <div className="token-sel" onClick={() => setModal("out")}>
                <TIcon t={tOut} />
                <span className="t-sym">{tOut.symbol}</span>
                <span className="t-chev">▼</span>
              </div>
              <input className="amt-input" placeholder="0.0000" value={amtOut ? parseFloat(amtOut).toFixed(6) : ""} readOnly />
            </div>
            <div className="token-meta">
              <span className="usd-val">on-chain quote</span>
              <span className="bal-row">BAL: {fmtN(balances[tOut.symbol] || "0", 4)}</span>
            </div>
          </div>
        </div>

        {/* error */}
        {errMsg && <div className="err-box" style={{ margin: "10px 14px 0" }}>{errMsg}</div>}

        {/* info */}
        {amtIn && amtOut && !errMsg && (
          <div className="info-box" style={{ margin: "10px 14px 0" }}>
            <div className="info-row"><span className="ik">RATE</span><span className="iv">1 {tIn.symbol} = {rate} {tOut.symbol}</span></div>
            <div className="info-row"><span className="ik">PRICE IMPACT</span><span className={`iv ${parseFloat(impact) > 1 ? "warn" : "good"}`}>{impact}%</span></div>
            <div className="info-row"><span className="ik">MIN RECEIVED</span><span className="iv">{minOut} {tOut.symbol}</span></div>
            <div className="info-row"><span className="ik">SLIPPAGE</span><span className="iv">{slip}%</span></div>
            <div className="info-row"><span className="ik">ROUTER</span><span className="iv" style={{ fontSize: 10 }}>{shortAddr(ROUTER_ADDRESS)}</span></div>
          </div>
        )}

        {/* progress */}
        {(swapping || approving) && (
          <div className="progress-bar" style={{ margin: "10px 14px 0" }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* button */}
        <div style={{ padding: "14px 14px 16px" }}>
          <button
            className={`cyber-btn ${btnCls}`}
            onClick={btnAction}
            disabled={btnCls === "disabled" || btnCls === "executing"}
          >
            {btnText}
          </button>
        </div>
      </div>
    </>
  );
}
