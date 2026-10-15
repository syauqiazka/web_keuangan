"use client";

/**
 * Reveal — animasikan anak ketika pertama kali masuk viewport.
 * Menggunakan useInView dari motion/react.
 * Hanya trigger sekali (once: true) untuk menghindari re-animasi saat scroll.
 */

import * as React from "react";
import { motion, useInView } from "motion/react";
import { fadeUp, tEnter } from "@/lib/motion";
import { useMotionContext } from "./MotionProvider";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Ambang masuk viewport (0–1). Default 0.15 */
  threshold?: number;
}

export function Reveal({
  children,
  className,
  delay = 0,
  threshold = 0.15,
}: RevealProps) {
  const { reducedMotion } = useMotionContext();
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      transition={{ ...tEnter, delay }}
    >
      {children}
    </motion.div>
  );
}
