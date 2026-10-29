"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = React.useState(false);
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Simpan elemen aktif sebelum dialog terbuka dan kembalikan saat ditutup
  React.useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";

      // Fokus awal ke field input/select/button pertama di dalam dialog
      const timer = setTimeout(() => {
        if (panelRef.current) {
          const focusables = panelRef.current.querySelectorAll<HTMLElement>(
            'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([aria-label="Tutup dialog"]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length > 0) {
            focusables[0].focus();
          } else {
            panelRef.current.focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
          previousActiveElement.current.focus();
        }
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  // Focus trap dan handler tombol Escape
  React.useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && onClose) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50"
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
          {/* Wadah fleksibel: items-start di layar pendek/mobile, sm:items-center di layar standar */}
          <div
            className="flex min-h-full items-start sm:items-center justify-center p-3 sm:p-4"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              if (e.target === e.currentTarget && onClose) {
                onClose();
              }
            }}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className={`w-full ${maxWidth} bg-surface border border-line rounded-[14px] shadow-overlay relative max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden my-auto sm:my-0 focus:outline-none`}
              variants={scaleIn}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              {/* Header: Judul & tombol X tetap terlihat */}
              <div className="shrink-0 p-5 sm:p-6 pb-3 sm:pb-4 border-b border-line/60 relative pr-12">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 text-text-3 hover:text-text rounded-[8px] hover:bg-panel transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
                    aria-label="Tutup dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <h2
                  id={titleId}
                  className="text-[17px] sm:text-[18px] font-semibold text-text leading-snug"
                >
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-[13px] text-text-3 font-normal leading-normal">
                    {description}
                  </p>
                )}
              </div>

              {/* Badan dialog: Scrollable dengan dvh & overscroll-contain */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 text-[14px] text-text-2">
                {children}
              </div>

              {/* Footer dialog: Aksi tetap terlihat di bawah jika disediakan */}
              {actions && (
                <div className="shrink-0 p-3 sm:p-4 border-t border-line flex items-center justify-end gap-3 bg-panel/30">
                  {actions}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
