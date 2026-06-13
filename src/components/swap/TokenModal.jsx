import { useState } from "react";
import { TOKENS } from "../../config/constants";
import { shortAddr, fmtN } from "../../config/constants";
import TIcon from "../common/TIcon";

export default function TokenModal({ exclude, onSelect, onClose, balances = {} }) {
  const [q, setQ] = useState("");

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
              <div className="tl-bal">{fmtN(balances[t.symbol] || "0", 4)}</div>
              <div className="tl-usd">on-chain</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
