"use client";

/**
 * StaggerGroup — menganimasikan sekumpulan elemen anak secara berurutan
 * dengan GSAP stagger timeline. Sangat halus, teratur, dan bebas layout shift.
 */

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { checkReducedMotion, GSAP_DURATION, GSAP_EASE } from "@/lib/motion";

interface StaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  duration?: number;
  distance?: number;
  as?: keyof React.JSX.IntrinsicElements;
}

export function StaggerGroup({
  children,
  className,
  staggerDelay = 0.08,
  duration = GSAP_DURATION.base,
  distance = 16,
  as: Component = "div",
}: StaggerGroupProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      if (checkReducedMotion()) {
        const items = containerRef.current.querySelectorAll("[data-stagger-item]");
        gsap.set(items, { opacity: 1, y: 0 });
        return;
      }

      const items = containerRef.current.querySelectorAll("[data-stagger-item]");
      if (!items.length) return;

      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: distance,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger: staggerDelay,
          ease: GSAP_EASE.atmos,
          clearProps: "transform",
        }
      );
    },
    { dependencies: [staggerDelay, duration, distance], scope: containerRef }
  );

  return React.createElement(
    Component,
    { ref: containerRef, className },
    children
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
  as: Component = "div",
}: StaggerItemProps) {
  return React.createElement(
    Component,
    { className, "data-stagger-item": "" },
    children
  );
}
