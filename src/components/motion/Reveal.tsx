"use client";

/**
 * Reveal — animasikan elemen ketika pertama kali masuk ke viewport
 * menggunakan GSAP. Hanya berjalan sekali (once) dan menghormati reduced-motion.
 */

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { checkReducedMotion, GSAP_DURATION, GSAP_EASE } from "@/lib/motion";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  duration?: number;
}

export function Reveal({
  children,
  className,
  delay = 0,
  threshold = 0.1,
  duration = GSAP_DURATION.enter,
}: RevealProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hasTriggered, setHasTriggered] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current || checkReducedMotion()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setHasTriggered(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [threshold]);

  const isVisible = hasTriggered || checkReducedMotion();

  useGSAP(
    () => {
      if (!containerRef.current || !hasTriggered) return;
      if (checkReducedMotion()) {
        gsap.set(containerRef.current, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: GSAP_EASE.atmos,
          clearProps: "transform",
        }
      );
    },
    { dependencies: [hasTriggered, delay, duration], scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ opacity: isVisible ? undefined : 0 }}
    >
      {children}
    </div>
  );
}
