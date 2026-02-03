import { useEffect, useRef } from "react";

export default function Modal({ open, title, children, onClose }) {
  const panelRef = useRef(null);

  // ESC close + body scroll lock
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);

    // lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // focus panel for accessibility
    setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Modal"}
        className="
          relative w-full max-w-lg
          bg-white border shadow-xl rounded-2xl
          overflow-hidden
          animate-[pop_160ms_ease-out]
        "
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-extrabold text-base sm:text-lg truncate">
              {title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
              Press ESC to close
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 h-10 w-10 grid place-items-center rounded-xl hover:bg-gray-100 active:scale-95 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body (scroll inside) */}
        <div className="p-4 sm:p-5 max-h-[70vh] sm:max-h-[75vh] overflow-auto">
          {children}
        </div>
      </div>

      {/* Tailwind custom keyframes */}
      <style>{`
        @keyframes pop {
          from { transform: translateY(12px) scale(0.98); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
