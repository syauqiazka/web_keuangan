"use client";

/**
 * FadeIn — GSAP entrance animation dengan easing editorial khas Atmos.
 * Lembut, presisi, dan menghormati prefers-reduced-motion.
 */

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { checkReducedMotion, GSAP_DURATION, GSAP_EASE } from "@/lib/motion";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
  /** Nilai blur awal dalam pixel (misal 8px untuk efek blur-to-sharp Atmos) */
  blur?: number;
  as?: keyof React.JSX.IntrinsicElements;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 14,
  duration = GSAP_DURATION.base,
  blur,
  as: Component = "div",
}: FadeInProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      if (checkReducedMotion()) {
        gsap.set(containerRef.current, { opacity: 1, filter: "none", x: 0, y: 0 });
        return;
      }

      let xOffset = 0;
      let yOffset = 0;
      if (direction === "up") yOffset = distance;
      else if (direction === "down") yOffset = -distance;
      else if (direction === "left") xOffset = distance;
      else if (direction === "right") xOffset = -distance;

      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          x: xOffset,
          y: yOffset,
          ...(blur ? { filter: `blur(${blur}px)` } : {}),
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          ...(blur ? { filter: "blur(0px)" } : {}),
          duration,
          delay,
          ease: GSAP_EASE.atmos,
          clearProps: blur ? "filter,opacity,transform" : "transform",
        }
      );
    },
    { dependencies: [delay, direction, distance, duration, blur], scope: containerRef }
  );

  return React.createElement(
    Component,
    { ref: containerRef, className },
    children
  );
}
