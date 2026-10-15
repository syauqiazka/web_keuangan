"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { slideRight } from "@/lib/motion";

export interface ToastMessage {
  id: string;
  message: string;
  type?: "default" | "error" | "success";
}

interface ToastContextType {
  toast: (message: string, type?: "default" | "error") => void;
  showToast: (message: string, type?: "default" | "error" | "success") => void;
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

  const showToast = React.useCallback(
    (message: string, type: "default" | "error" | "success" = "default") => {
      const mapped: "default" | "error" =
        type === "error" ? "error" : "default";
      toast(message, mapped);
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role="status"
              className={`pointer-events-auto bg-canvas border rounded-[4px] p-3 shadow-overlay text-[14px] leading-snug ${
                t.type === "error"
                  ? "border-danger text-danger"
                  : "border-line-strong text-text"
              }`}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={slideRight}
              layout
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
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
