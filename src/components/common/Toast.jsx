import React, { useState, useCallback, useRef } from "react";

// 1. Ekspor Komponen sebagai default
export default function Toast({ toast }) {
  if (!toast) return null;
  const typeClass = toast.type === "err" ? " err" : toast.type === "warn" ? " warn" : "";
  return (
    <div className={`toast${typeClass}`}>
      {toast.msg}
    </div>
  );
}

// 2. Ekspor Hook secara named export
export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((msg, type = "ok") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  return { toast, showToast };
}