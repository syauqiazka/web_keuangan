"use client";

import * as React from "react";

export interface ToastMessage {
  id: string;
  message: string;
  type?: "default" | "error";
}

interface ToastContextType {
  toast: (message: string, type?: "default" | "error") => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback(
    (message: string, type: "default" | "error" = "default") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto bg-canvas border rounded-[4px] p-3 shadow-overlay text-[14px] leading-snug transition-all ${
              t.type === "error"
                ? "border-danger text-danger"
                : "border-line-strong text-text"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast harus digunakan di dalam ToastProvider");
  }
  return ctx;
}
