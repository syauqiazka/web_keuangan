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
  /** Nilai blur awal dalam pixel (misal 8px untuk efek blur-to-sharp Atmos) */
  blur?: number;
}

export function Reveal({
  children,
  className,
  delay = 0,
  threshold = 0.1,
  duration = GSAP_DURATION.enter,
  blur,
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
        gsap.set(containerRef.current, { opacity: 1, filter: "none", y: 0 });
        return;
      }

      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          y: 16,
          ...(blur ? { filter: `blur(${blur}px)` } : {}),
        },
        {
          opacity: 1,
          y: 0,
          ...(blur ? { filter: "blur(0px)" } : {}),
          duration,
          delay,
          ease: GSAP_EASE.atmos,
          clearProps: blur ? "filter,opacity,transform" : "transform",
        }
      );
    },
    { dependencies: [hasTriggered, delay, duration, blur], scope: containerRef }
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
