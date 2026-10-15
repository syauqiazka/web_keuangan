"use client";

/**
 * StaggerGroup — menganimasikan anak-anaknya secara berurutan (stagger).
 * Dipakai untuk daftar kartu, baris ringkasan, dan grup elemen sejenis.
 */

import * as React from "react";
import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useMotionContext } from "./MotionProvider";

interface StaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Jarak delay antar anak dalam detik. Default 0.07 */
  staggerDelay?: number;
  as?: keyof React.JSX.IntrinsicElements;
}

export function StaggerGroup({
  children,
  className,
  staggerDelay = 0.07,
  as = "div",
}: StaggerGroupProps) {
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
      variants={staggerContainer(staggerDelay)}
    >
      {children}
    </Tag>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: StaggerItemProps) {
  const { reducedMotion } = useMotionContext();
  const Tag = motion[as as keyof typeof motion] as typeof motion.div;

  if (reducedMotion) {
    return React.createElement(as, { className }, children);
  }

  return (
    <Tag className={className} variants={staggerItem}>
      {children}
    </Tag>
  );
}
