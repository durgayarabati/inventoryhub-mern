import { useEffect, useRef } from "react";

export default function Modal({ open, title, onClose, children }) {
  const panelRef = useRef(null);

  // ✅ Focus only once when modal opens
  useEffect(() => {
    if (!open) return;

    // focus first input if exists, else focus panel
    const t = setTimeout(() => {
      const first = panelRef.current?.querySelector(
        "input, textarea, select, button, [tabindex]:not([tabindex='-1'])"
      );
      (first || panelRef.current)?.focus?.();
    }, 0);

    return () => clearTimeout(t);
  }, [open]); // ✅ only depends on open

  // ✅ ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-[92vw] max-w-xl rounded-2xl bg-white shadow-xl border p-4"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()} // ✅ prevents parent focus handlers
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-bold">{title}</h3>
          <button type="button" className="px-3 py-1 rounded-lg border" onClick={onClose}>
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
