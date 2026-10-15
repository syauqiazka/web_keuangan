"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
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
  maxWidth = "max-w-[480px]",
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeOnly}
          onClick={(e) => {
            if (e.target === e.currentTarget && onClose) {
              onClose();
            }
          }}
          style={{ backgroundColor: "rgb(21 21 21 / 0.45)" }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className={`w-full ${maxWidth} bg-canvas border border-line-strong rounded-[8px] p-6 shadow-overlay relative`}
            variants={scaleIn}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h2
                id="dialog-title"
                className="text-[21px] font-[400] font-display text-text leading-snug"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-[14px] text-text-3 font-[360] leading-normal">
                  {description}
                </p>
              )}
            </div>

            <div className="mb-6 text-[14px] text-text-2">{children}</div>

            {actions && (
              <div className="flex items-center justify-end gap-3 pt-2">
                {actions}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
