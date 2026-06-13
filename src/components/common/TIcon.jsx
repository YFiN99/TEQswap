export default function TIcon({ t, size = 22 }) {
  return (
    <div
      className="t-icon"
      style={{
        width: size, height: size,
        background: t?.bg || "#111",
        border: `1px solid ${t?.color || "#333"}`,
        color: t?.color || "#fff",
        fontSize: size < 18 ? 7 : 9,
      }}
    >
      {t?.symbol?.slice(0, 2)}
    </div>
  );
}
