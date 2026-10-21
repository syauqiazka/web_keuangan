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
  as?: keyof React.JSX.IntrinsicElements;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 14,
  duration = GSAP_DURATION.base,
  as: Component = "div",
}: FadeInProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      if (checkReducedMotion()) {
        gsap.set(containerRef.current, { opacity: 1, x: 0, y: 0 });
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
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration,
          delay,
          ease: GSAP_EASE.atmos,
          clearProps: "transform",
        }
      );
    },
    { dependencies: [delay, direction, distance, duration], scope: containerRef }
  );

  return React.createElement(
    Component,
    { ref: containerRef, className },
    children
  );
}
