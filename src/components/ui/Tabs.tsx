"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

/**
 * Tabs — with a shared sliding underline indicator (motion layoutId).
 * The active pill glides smoothly between tabs like modern browser tabs.
 */
export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  const LAYOUT_ID = React.useId();

  return (
    <div className={`flex border-b border-line gap-1 ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative pb-2.5 px-2 text-[14px] transition-colors duration-150 focus:outline-none ${
              isActive
                ? "font-semibold text-brand"
                : "font-[500] text-text-3 hover:text-text"
            }`}
          >
            {tab.label}

            {/* Sliding underline — shared layoutId makes it glide */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  layoutId={`tab-underline-${LAYOUT_ID}`}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand rounded-full"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 38,
                    mass: 0.6,
                  }}
                />
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
