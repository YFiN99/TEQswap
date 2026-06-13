import { shortAddr } from "../config/constants";

export default function TopBar({ wallet, wrongChain, onConnect, onSwitch }) {
  return (
    <>
      <nav className="topbar">
        <div className="logo">TEQ<span>swap</span></div>
        <div className="chain-pill">
          <div className="chain-dot" />
          L2:420377
        </div>
        <button
          className={`connect-btn${wallet ? " connected" : ""}`}
          onClick={!wallet ? onConnect : undefined}
        >
          {wallet ? shortAddr(wallet) : "[ CONNECT ]"}
        </button>
      </nav>

      {wrongChain && (
        <div className="wrong-chain">
          <span>⚠ WRONG NETWORK — SWITCH TO TEQOIN L2</span>
          {/* Gunakan onSwitch untuk mengganti network */}
          <button className="switch-btn" onClick={onSwitch}>SWITCH</button>
        </div>
      )}
    </>
  );
}