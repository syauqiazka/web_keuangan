"use client";

/**
 * AnimatedNumber — menampilkan angka dengan transisi counter presisi GSAP.
 * Terinspirasi dari motion finansial Atmos Gallery: halus, tidak berkedip,
 * dan secara langsung mencapai nilai nominal yang tepat.
 */

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { checkReducedMotion, GSAP_DURATION, GSAP_EASE } from "@/lib/motion";

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  format = (n) => n.toLocaleString("id-ID"),
  className,
  duration = GSAP_DURATION.counter,
}: AnimatedNumberProps) {
  const spanRef = React.useRef<HTMLSpanElement>(null);
  const prevValueRef = React.useRef<number>(0);
  const isFirstRender = React.useRef<boolean>(true);

  useGSAP(
    () => {
      if (!spanRef.current) return;

      if (checkReducedMotion()) {
        spanRef.current.textContent = format(value);
        prevValueRef.current = value;
        return;
      }

      const start = isFirstRender.current ? 0 : prevValueRef.current;
      isFirstRender.current = false;
      prevValueRef.current = value;

      const obj = { val: start };

      const tween = gsap.to(obj, {
        val: value,
        duration,
        ease: GSAP_EASE.smooth,
        onUpdate: () => {
          if (spanRef.current) {
            spanRef.current.textContent = format(Math.round(obj.val));
          }
        },
        onComplete: () => {
          if (spanRef.current) {
            spanRef.current.textContent = format(value);
          }
        },
      });

      return () => {
        tween.kill();
      };
    },
    { dependencies: [value, duration], scope: spanRef }
  );

  return (
    <span ref={spanRef} className={className}>
      {format(value)}
    </span>
  );
}
