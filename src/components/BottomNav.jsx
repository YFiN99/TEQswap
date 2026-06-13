const TABS = [
  { id: "swap",  icon: "⇄", label: "SWAP"  },
  { id: "pool",  icon: "◎", label: "POOL"  },
  { id: "stats", icon: "⬡", label: "STATS" },
];

export default function BottomNav({ active, onChange }) {
  // Fungsi handler yang aman
  const handleNavigation = (id) => {
    if (typeof onChange === 'function') {
      onChange(id);
    } else {
      console.warn("BottomNav: onChange prop tidak ditemukan!");
    }
  };

  return (
    <nav className="bot-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`bn-item${active === t.id ? " on" : ""}`}
          onClick={() => handleNavigation(t.id)}
        >
          <span className="bn-icon">{t.icon}</span>
          <span className="bn-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}