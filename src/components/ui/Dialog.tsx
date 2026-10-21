"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { fadeOnly, scaleIn } from "@/lib/motion";

export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  maxWidth = "max-w-[500px]",
}: DialogProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    }
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeOnly}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget && onClose) {
              onClose();
            }
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className={`w-full ${maxWidth} bg-surface border border-line rounded-[8px] p-6 shadow-overlay relative max-h-[90vh] overflow-y-auto`}
            variants={scaleIn}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-5 right-5 p-1 text-text-3 hover:text-text rounded-[4px] hover:bg-panel transition-colors"
                aria-label="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="mb-5 pr-8">
              <h2
                id="dialog-title"
                className="text-[18px] font-semibold text-text leading-snug"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-[13px] text-text-3 font-normal leading-normal">
                  {description}
                </p>
              )}
            </div>

            <div className="mb-6 text-[14px] text-text-2">{children}</div>

            {actions && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                {actions}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
