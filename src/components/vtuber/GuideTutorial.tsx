"use client";

/**
 * GuideTutorial.tsx — Tampilan langkah-langkah panduan interaktif
 */

import React from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, HelpCircle } from "lucide-react";
import { PageTutorial } from "./guide-types";

interface GuideTutorialProps {
  tutorial: PageTutorial;
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onFinish: () => void;
}

export function GuideTutorial({
  tutorial,
  currentStepIndex,
  onNext,
  onPrev,
  onReset,
  onFinish,
}: GuideTutorialProps) {
  const steps = tutorial.steps;
  const isFinished = currentStepIndex >= steps.length;
  const step = !isFinished ? steps[currentStepIndex] : null;

  return (
    <div className="p-3 flex flex-col gap-2.5 text-xs">
      {/* Header Info Panduan */}
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div>
          <h4 className="font-medium text-text text-[13px]">{tutorial.pageTitle}</h4>
          <p className="text-[11px] text-text-3">{tutorial.summary}</p>
        </div>
        {!isFinished && (
          <span className="font-mono text-[11px] text-text-3 px-1.5 py-0.5 rounded border border-line bg-panel">
            {currentStepIndex + 1}/{steps.length}
          </span>
        )}
      </div>

      {/* Konten Langkah Aktual */}
      {!isFinished && step ? (
        <div className="flex flex-col gap-2 py-1">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-accent/15 text-accent text-[10px] font-mono font-bold flex items-center justify-center mt-0.5">
              {currentStepIndex + 1}
            </span>
            <div className="flex-1">
              <h5 className="font-medium text-text">{step.title}</h5>
              <p className="mt-1 text-text-2 leading-relaxed">{step.description}</p>
              {step.tip && (
                <div className="mt-2 flex items-start gap-1.5 p-2 rounded-[2px] bg-panel border border-line text-[11px] text-text-3">
                  <HelpCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span>{step.tip}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bar Navigasi Langkah */}
          <div className="flex items-center justify-between pt-2 border-t border-line mt-1">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1 px-2 py-1 rounded-[2px] border border-line bg-panel text-text-2 hover:text-text disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Sebelumnya</span>
            </button>

            {currentStepIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={onNext}
                className="flex items-center gap-1 px-3 py-1 rounded-[2px] bg-text text-on-ink hover:opacity-90 transition-opacity font-medium"
              >
                <span>Lanjut</span>
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onFinish}
                className="flex items-center gap-1 px-3 py-1 rounded-[2px] bg-accent text-white hover:opacity-90 transition-opacity font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Selesai</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Status Selesai */
        <div className="py-3 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-accent" strokeWidth={1.5} />
          </div>
          <div>
            <h5 className="font-medium text-text text-sm">Panduan Selesai</h5>
            <p className="text-[11px] text-text-3 mt-0.5">
              Anda telah mempelajari semua fitur utama halaman ini.
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border border-line bg-panel text-text hover:border-line-strong transition-colors text-xs font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Ulangi Panduan</span>
          </button>
        </div>
      )}
    </div>
  );
}
