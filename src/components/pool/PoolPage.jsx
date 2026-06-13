import { useState } from "react";
import { TOKENS, POOL_PAIRS } from "../../config/constants";
import TIcon from "../common/TIcon";
import AddLiqModal from "./AddLiqModal";

export default function PoolPage({ wallet, signer, provider }) {
  const [activePair, setActivePair] = useState(null);

  return (
    <>
      {activePair && (
        <AddLiqModal
          pair={activePair}
          signer={signer}
          wallet={wallet}
          provider={provider}
          onClose={() => setActivePair(null)}
        />
      )}

      <div className="pool-hd">
        <span className="pool-htitle">LIQUIDITY_POOLS</span>
        <button
          className="new-pos-btn"
          onClick={() => setActivePair({ a: TOKENS[0], b: TOKENS[1] })}
        >
          + NEW
        </button>
      </div>

      <div className="warn-banner">
        ⚠ TVL/APR memerlukan subgraph. Klik ADD LIQUIDITY untuk deposit.
      </div>

      {POOL_PAIRS.map((p, i) => (
        <div key={i} className="pool-card">
          <div className="pool-pair">
            <div className="pool-icons">
              <TIcon t={p.a} size={26} />
              <TIcon t={p.b} size={26} />
            </div>
            <span className="pool-nm">{p.a.symbol}/{p.b.symbol}</span>
            <span className="pool-fee">0.3%</span>
          </div>
          <div className="pool-grid">
            <div><div className="pg-label">TVL</div><div className="pg-val">—</div></div>
            <div><div className="pg-label">24H VOL</div><div className="pg-val">—</div></div>
            <div><div className="pg-label">APR</div><div className="pg-val hi">—</div></div>
          </div>
          <button className="add-btn" onClick={() => setActivePair(p)}>
            ADD LIQUIDITY
          </button>
        </div>
      ))}
    </>
  );
}
