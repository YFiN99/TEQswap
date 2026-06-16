import { shortAddr } from "../config/constants";

export default function TopBar({ wallet, wrongChain, onConnect, onSwitch }) {
  // Tambahkan pengecekan agar tidak error jika fungsi kosong
  const handleConnect = () => {
    if (onConnect && typeof onConnect === 'function') {
      onConnect();
    }
  };

  const handleSwitch = () => {
    if (onSwitch && typeof onSwitch === 'function') {
      onSwitch();
    }
  };

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
          // Pastikan menggunakan fungsi wrapper yang aman
          onClick={!wallet ? handleConnect : undefined}
        >
          {wallet ? shortAddr(wallet) : "[ CONNECT ]"}
        </button>
      </nav>

      {wrongChain && (
        <div className="wrong-chain">
          <span>⚠ WRONG NETWORK — SWITCH TO TEQOIN L2</span>
          <button className="switch-btn" onClick={handleSwitch}>SWITCH</button>
        </div>
      )}
    </>
  );
}