"use client";

/**
 * FadeIn — wrapper sederhana fade + slide dari bawah.
 * Cocok untuk header halaman, section, dan elemen tunggal.
 */

import * as React from "react";
import { motion } from "motion/react";
import { fadeUp, tEnter } from "@/lib/motion";
import { useMotionContext } from "./MotionProvider";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  as = "div",
}: FadeInProps) {
  const { reducedMotion } = useMotionContext();
  const Tag = motion[as as keyof typeof motion] as typeof motion.div;

  if (reducedMotion) {
    return React.createElement(as, { className }, children);
  }

  return (
    <Tag
      className={className}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ ...tEnter, delay }}
    >
      {children}
    </Tag>
  );
}
