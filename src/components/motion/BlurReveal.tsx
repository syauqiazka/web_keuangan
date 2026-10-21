"use client";

/**
 * BlurReveal — GSAP blur-to-sharp reveal motion design terinspirasi Atmos Gallery.
 * Mentransisikan teks dan elemen dari filter blur & low opacity ke visual tajam presisi.
 *
 * Prinsip:
 * - Halus, elegan, tidak melompat.
 * - Menghormati prefers-reduced-motion.
 * - Tidak menyembunyikan konten secara permanen (SSR-safe, clearProps saat selesai).
 */

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { checkReducedMotion, GSAP_DURATION, GSAP_EASE } from "@/lib/motion";

export interface BlurRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Jeda waktu sebelum animasi dimulai (detik) */
  delay?: number;
  /** Durasi animasi (detik, default 0.75s ala Atmos) */
  duration?: number;
  /** Kekuatan blur awal dalam pixel (default 10px, 6-8px untuk teks kecil/kartu) */
  blur?: number;
  /** Jarak pergerakan vertikal dalam pixel (default 12px) */
  distance?: number;
  /** Arah pergerakan (default "up") */
  direction?: "up" | "down" | "none";
  /** Elemen HTML penampung (default "div") */
  as?: keyof React.JSX.IntrinsicElements;
  /** Jeda stagger antar elemen [data-blur-item] jika ada */
  stagger?: number;
}

export function BlurReveal({
  children,
  className,
  delay = 0,
  duration = GSAP_DURATION.blurReveal,
  blur = 10,
  distance = 12,
  direction = "up",
  as: Component = "div",
  stagger,
}: BlurRevealProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      if (checkReducedMotion()) {
        const items = containerRef.current.querySelectorAll("[data-blur-item]");
        if (items.length > 0) {
          gsap.set(items, { opacity: 1, filter: "none", y: 0 });
        } else {
          gsap.set(containerRef.current, { opacity: 1, filter: "none", y: 0 });
        }
        return;
      }

      const items = containerRef.current.querySelectorAll("[data-blur-item]");
      const targets = items.length > 0 ? items : containerRef.current;

      let yStart = 0;
      if (direction === "up") yStart = distance;
      else if (direction === "down") yStart = -distance;

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          filter: `blur(${blur}px)`,
          y: yStart,
        },
        {
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          duration,
          delay,
          stagger: stagger ?? (items.length > 0 ? 0.08 : undefined),
          ease: GSAP_EASE.atmos,
          clearProps: "filter,opacity,transform",
        }
      );
    },
    { dependencies: [delay, duration, blur, distance, direction, stagger], scope: containerRef }
  );

  return React.createElement(
    Component,
    { ref: containerRef, className },
    children
  );
}

/**
 * BlurItem — penanda elemen anak untuk di-stagger oleh BlurReveal induk
 */
export function BlurItem({
  children,
  className,
  as: Component = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  return React.createElement(
    Component,
    { className, "data-blur-item": "" },
    children
  );
}
