import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { TOKENS, shortAddr, fmtN } from "../../config/constants";
import TIcon from "../common/TIcon";

export default function TokenModal({ exclude, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const { address } = useAccount();

  // Komponen pembantu untuk mengambil saldo per token agar tidak membebani render
  const TokenBalance = ({ token }) => {
    const { data } = useBalance({ 
      address, 
      token: token.address === "native" ? undefined : token.address 
    });
    return <>{fmtN(data?.formatted || "0", 4)}</>;
  };

  const list = TOKENS.filter(t =>
    t.symbol !== exclude &&
    (t.symbol.toLowerCase().includes(q.toLowerCase()) ||
     t.name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hd">
          <span className="card-title">SELECT_TOKEN</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <input
          className="search-inp"
          placeholder="> SEARCH TOKEN OR ADDRESS_"
          value={q}
          onChange={e => setQ(e.target.value)}
          autoFocus
        />

        <div className="token-list">
          {list.map(t => (
            <div
              key={t.symbol}
              className="tl-item"
              onClick={() => { onSelect(t); onClose(); }}
            >
              <TIcon t={t} size={34} />
              <div className="tl-info">
                <div className="tl-sym">{t.symbol}</div>
                <div className="tl-name">{t.name} // {shortAddr(t.address)}</div>
              </div>
              <div className="tl-r">
                <div className="tl-bal">
                  {/* Panggil komponen saldo dinamis */}
                  <TokenBalance token={t} />
                </div>
                <div className="tl-usd">on-chain</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}